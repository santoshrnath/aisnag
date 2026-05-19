// Index (or re-index) a single snag's text content into the vector store.
// Called whenever a snag is created, edited, commented, or has its
// transcript updated. Cheap to run — we delete by snagId first, then
// re-write fresh chunks.

import { prisma } from "@/lib/prisma";
import { getEmbeddings } from "@/lib/embeddings";
import { getVectorService } from "@/lib/vector";
import { chunkSnag } from "@/lib/rag/chunker";
import { currentTenant } from "@/lib/tenant";

export async function indexSnag(snagId: string): Promise<number> {
  const tenantId = currentTenant();

  const snag = await prisma.snag.findUnique({
    where: { id: snagId },
    include: {
      trade: true,
      comments: { include: { author: true } },
      voiceNotes: true,
    },
  });
  if (!snag) return 0;

  const chunks = chunkSnag({
    title: snag.title,
    description: snag.description,
    trade: snag.trade?.name ?? null,
    severity: snag.severity,
    status: snag.status,
    room: snag.room,
    area: snag.area,
    code: snag.code,
    comments: snag.comments.map((c) => ({
      text: c.text,
      author: c.author?.name ?? null,
      createdAt: c.createdAt,
    })),
    transcripts: snag.voiceNotes
      .filter((v) => v.transcript)
      .map((v) => ({ text: v.transcript! })),
    aiSummary: snag.aiSummary,
  });

  if (chunks.length === 0) return 0;

  const embeddings = await getEmbeddings();
  const vectors = await embeddings.embed(chunks.map((c) => c.text));
  const dim = vectors[0]?.length ?? (await embeddings.dimensions());

  const vector = await getVectorService();
  await vector.ensureCollection(dim);
  await vector.deleteBySnag(tenantId, snagId);

  // Wipe DB chunk rows and re-create.
  await prisma.snagChunk.deleteMany({ where: { snagId } });

  const dbChunks = await Promise.all(
    chunks.map((c) =>
      prisma.snagChunk.create({
        data: {
          tenantId,
          snagId,
          source: c.source,
          text: c.text,
          tokenCount: c.tokenCount,
          metadata: {
            projectId: snag.projectId,
            drawingId: snag.drawingId,
            trade: snag.trade?.name ?? null,
            severity: snag.severity,
            status: snag.status,
            room: snag.room,
            code: snag.code,
          },
        },
      }),
    ),
  );

  const records = dbChunks.map((dbChunk, i) => ({
    id: dbChunk.id,
    vector: vectors[i],
    payload: {
      tenantId,
      projectId: snag.projectId,
      drawingId: snag.drawingId,
      snagId,
      chunkId: dbChunk.id,
      status: snag.status,
      severity: snag.severity,
      trade: snag.trade?.name ?? null,
      room: snag.room ?? null,
      area: snag.area ?? null,
      code: snag.code,
      textPreview: dbChunk.text.slice(0, 240),
      source: dbChunk.source,
    },
  }));

  await vector.upsert(records);

  // Stamp vectorId on the chunk rows.
  await Promise.all(
    dbChunks.map((c) =>
      prisma.snagChunk.update({
        where: { id: c.id },
        data: { vectorId: c.id },
      }),
    ),
  );

  return dbChunks.length;
}
