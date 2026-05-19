// Semantic snag search.
//
// Flow:
//   1. Embed the query.
//   2. Pull top-K chunks from the vector store with optional filters
//      (status, severity, trade, project).
//   3. Group chunks back to their parent snags, pick best chunk per snag
//      as the "evidence" quote.
//   4. Hand the top snags + evidence to Claude with a short prompt and
//      get back a one-line explanation per snag.
//
// The retrieval is the truth — Claude only annotates, never invents.

import { prisma } from "@/lib/prisma";
import { getEmbeddings } from "@/lib/embeddings";
import { getVectorService, type VectorSearchHit } from "@/lib/vector";
import { anthropic, extractJson, MODEL } from "@/lib/anthropic";
import { currentTenant } from "@/lib/tenant";

export interface SearchSnagResult {
  snagId: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  trade: string | null;
  drawingName: string | null;
  room: string | null;
  score: number;          // best chunk score, 0..1
  evidence: string;       // best-matching chunk text
  explanation: string | null; // Claude's one-line reason
  createdAt: Date;
}

interface SearchOpts {
  query: string;
  projectId?: string;
  statuses?: string[];
  severities?: string[];
  trades?: string[];
  limit?: number;
  explain?: boolean;
}

export async function searchSnags(opts: SearchOpts): Promise<SearchSnagResult[]> {
  const tenantId = currentTenant();
  const limit = opts.limit ?? 12;

  const embeddings = await getEmbeddings();
  const [vec] = await embeddings.embed([opts.query]);
  const dim = vec.length;

  const vector = await getVectorService();
  await vector.ensureCollection(dim);

  const hits = await vector.search({
    vector: vec,
    limit: limit * 4, // over-fetch so we can de-dupe per snag
    filter: {
      tenantId,
      projectIds: opts.projectId ? [opts.projectId] : undefined,
      statuses: opts.statuses,
      severities: opts.severities,
      trades: opts.trades,
    },
  });

  // Group by snagId, keep the best-scoring chunk as evidence.
  const bestPerSnag = new Map<string, VectorSearchHit>();
  for (const h of hits) {
    const sid = h.payload.snagId;
    if (!bestPerSnag.has(sid) || (bestPerSnag.get(sid)!.score ?? 0) < h.score) {
      bestPerSnag.set(sid, h);
    }
  }

  const topSnagIds = Array.from(bestPerSnag.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([sid]) => sid);

  if (topSnagIds.length === 0) return [];

  const snags = await prisma.snag.findMany({
    where: { id: { in: topSnagIds } },
    include: { trade: true, drawing: true },
  });
  const snagById = new Map(snags.map((s) => [s.id, s]));

  const baseResults: SearchSnagResult[] = topSnagIds
    .map((sid) => {
      const s = snagById.get(sid);
      const hit = bestPerSnag.get(sid);
      if (!s || !hit) return null;
      return {
        snagId: sid,
        code: s.code,
        title: s.title,
        status: s.status,
        severity: s.severity,
        trade: s.trade?.name ?? null,
        drawingName: s.drawing?.name ?? null,
        room: s.room,
        score: hit.score,
        evidence: String(hit.payload.textPreview ?? ""),
        explanation: null,
        createdAt: s.createdAt,
      } as SearchSnagResult;
    })
    .filter((x): x is SearchSnagResult => x != null);

  if (!opts.explain || baseResults.length === 0) return baseResults;

  // Ask Claude for a one-line "why this matches" per snag — no scoring,
  // just plain English. Strict JSON keyed by snagId.
  const SYSTEM = `You annotate snag search results.
For each snag, return ONE short sentence (≤ 22 words) explaining why this snag matches the user's query, citing the evidence text. Do NOT invent facts not present in the evidence.
Return strict JSON: { "<snagId>": "<sentence>", ... }. No prose, no fences.`;

  const userMsg = [
    `Query: "${opts.query}"`,
    `Snags:`,
    ...baseResults.map((r) =>
      `- id=${r.snagId} | ${r.code} | ${r.title} | trade=${r.trade ?? "—"} | severity=${r.severity} | status=${r.status}\n  evidence: "${r.evidence.slice(0, 280)}"`,
    ),
  ].join("\n");

  try {
    const res = await anthropic().messages.create({
      model: MODEL(),
      max_tokens: 800,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const explanations = extractJson<Record<string, string>>(res);
    for (const r of baseResults) {
      r.explanation = explanations[r.snagId] ?? null;
    }
  } catch {
    // Explanations are a nice-to-have — if Claude wobbles, return the raw hits.
  }

  return baseResults;
}
