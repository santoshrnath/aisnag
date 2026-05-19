// Snag-aware chunker.
//
// A snag is small but its searchable corpus expands once we include
// comments, transcripts and AI summaries. We chunk at a *semantic*
// granularity — one chunk per distinct piece of evidence — so the
// embedding for "tile broken near window" doesn't get diluted by an
// unrelated comment from three days later.
//
// Rules of thumb:
//   - title + description always becomes the first chunk (the "headline")
//   - each comment is its own chunk (with author + time stamped in)
//   - each voice transcript is its own chunk
//   - long descriptions (> 600 chars) are split on sentence boundaries

export interface SnagChunkInput {
  title: string;
  description?: string | null;
  trade?: string | null;
  severity?: string | null;
  status?: string | null;
  room?: string | null;
  area?: string | null;
  code?: string | null;
  comments?: { text: string; author?: string | null; createdAt?: Date | string }[];
  transcripts?: { text: string }[];
  aiSummary?: string | null;
}

export interface SnagChunkOut {
  source: "title+description" | "comment" | "voice-transcript" | "ai-summary";
  text: string;
  tokenCount: number;
}

const SOFT_LIMIT = 600;

function approxTokens(s: string): number {
  // Rough estimate — 1 token ≈ 4 chars for English. Good enough for sizing.
  return Math.ceil(s.length / 4);
}

function splitOnSentences(text: string, max = SOFT_LIMIT): string[] {
  if (text.length <= max) return [text];
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length + 1 > max && buf.length > 0) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf) out.push(buf.trim());
  return out;
}

function prefix(input: SnagChunkInput): string {
  // Stuff useful filter signals into every chunk's text so retrieval can
  // match keyword-y queries even before metadata filters apply.
  const tags: string[] = [];
  if (input.code) tags.push(input.code);
  if (input.trade) tags.push(input.trade);
  if (input.severity) tags.push(input.severity.toLowerCase());
  if (input.room) tags.push(input.room);
  if (input.area) tags.push(input.area);
  return tags.length ? `[${tags.join(" • ")}] ` : "";
}

export function chunkSnag(input: SnagChunkInput): SnagChunkOut[] {
  const out: SnagChunkOut[] = [];
  const pre = prefix(input);

  // Headline chunk — always present.
  const headline = [input.title, input.description ?? ""].filter(Boolean).join(". ");
  for (const piece of splitOnSentences(headline)) {
    const text = `${pre}${piece}`;
    out.push({ source: "title+description", text, tokenCount: approxTokens(text) });
  }

  // AI summary, if any.
  if (input.aiSummary) {
    for (const piece of splitOnSentences(input.aiSummary)) {
      const text = `${pre}${piece}`;
      out.push({ source: "ai-summary", text, tokenCount: approxTokens(text) });
    }
  }

  // Each comment its own chunk.
  for (const c of input.comments ?? []) {
    if (!c.text?.trim()) continue;
    const who = c.author ? ` (${c.author})` : "";
    for (const piece of splitOnSentences(c.text)) {
      const text = `${pre}Comment${who}: ${piece}`;
      out.push({ source: "comment", text, tokenCount: approxTokens(text) });
    }
  }

  // Voice transcripts.
  for (const t of input.transcripts ?? []) {
    if (!t.text?.trim()) continue;
    for (const piece of splitOnSentences(t.text)) {
      const text = `${pre}Voice: ${piece}`;
      out.push({ source: "voice-transcript", text, tokenCount: approxTokens(text) });
    }
  }

  return out;
}
