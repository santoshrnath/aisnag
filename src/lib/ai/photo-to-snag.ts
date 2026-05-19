// Photo-to-snag — the wow moment.
//
// User takes a photo of a defect. Claude vision returns a draft snag:
// title, description, trade, severity. User confirms or edits before save.
//
// Strict JSON. Explicit anti-hallucination guidance — if the photo doesn't
// show a clear defect, we say so rather than invent one.

import { anthropic, extractJson, MODEL } from "@/lib/anthropic";

export interface PhotoToSnagDraft {
  detected: boolean;
  title: string | null;
  description: string | null;
  trade:
    | "MEP"
    | "Civil"
    | "Finishing"
    | "Joinery"
    | "Painting"
    | "Flooring"
    | "Plumbing"
    | "Electrical"
    | "Other"
    | null;
  severity: "COSMETIC" | "FUNCTIONAL" | "SAFETY" | null;
  confidence: number; // 0..1
  reasoning: string | null;
}

const SYSTEM = `You are an expert construction quality inspector reviewing a defect photo from a building site.

Your job: produce a short, actionable snag entry — exactly as a site engineer would write it for the contractor responsible.

Rules:
- If the photo does not show a construction defect (e.g. it's a person, a landscape, blurry, indoors with no issue visible), set "detected": false and leave the other fields null. Do NOT invent a defect.
- Title: ≤ 60 chars, plain English, no padding ("Wall paint uneven", "Tile chipped near skirting", "Socket misaligned").
- Description: 1–3 sentences, only what you can see. Mention location if visible (corner, near window, edge). Do not speculate about cause unless obvious.
- Trade: pick the single most responsible trade from the enum.
- Severity:
    - COSMETIC: visual only, no functional impact
    - FUNCTIONAL: affects use of the element (door doesn't close, socket loose)
    - SAFETY: anyone could be hurt (exposed wire, broken glass, trip hazard)
- Confidence: how sure you are this is a real defect (0..1).
- Reasoning: one short line — what made you decide.

Return STRICT JSON only, no prose, no fences:
{
  "detected": boolean,
  "title": string|null,
  "description": string|null,
  "trade": string|null,
  "severity": string|null,
  "confidence": number,
  "reasoning": string|null
}`;

export async function photoToSnag(opts: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  hint?: string; // optional location hint like "Level 5, Room 503"
}): Promise<PhotoToSnagDraft> {
  const userText = opts.hint
    ? `Location hint from the engineer: ${opts.hint}. Inspect the photo and produce the snag entry as JSON.`
    : `Inspect the photo and produce the snag entry as JSON.`;

  const res = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: 800,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: opts.mediaType,
              data: opts.imageBase64,
            },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  return extractJson<PhotoToSnagDraft>(res);
}
