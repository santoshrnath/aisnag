// Voice-to-snag.
//
// Transcription happens on the client via the Web Speech API (free, runs in
// the browser, no audio leaves the device unless the user uses Chrome's
// cloud recognition). The transcript text comes here, and Claude structures
// it into a snag draft.
//
// If the user is on a browser without speech recognition we still accept a
// typed input — the structuring step is the same either way.

import { anthropic, extractJson, MODEL } from "@/lib/anthropic";

export interface VoiceToSnagDraft {
  title: string;
  description: string;
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
  room: string | null;
  reasoning: string | null;
}

const SYSTEM = `You convert a spoken site-walk note from a construction engineer into a structured snag entry.

Input: a short transcript like "scratch on the door frame near the master bedroom entrance, looks like impact damage, paint touch-up needed".

Output: strict JSON, no prose, no fences:
{
  "title": short (≤ 60 chars) headline,
  "description": 1–3 sentences cleaned up from the transcript — keep the engineer's facts, drop the umms,
  "trade": single best trade from the enum (MEP, Civil, Finishing, Joinery, Painting, Flooring, Plumbing, Electrical, Other),
  "severity": COSMETIC | FUNCTIONAL | SAFETY,
  "room": room/location mentioned, or null,
  "reasoning": one short line on how you classified trade + severity
}

Rules:
- Never invent details the engineer didn't say.
- If the transcript is unclear, prefer null over a guess for trade / severity / room.
- Title is in plain English, no padding.
- Severity heuristics: visual only → COSMETIC; affects use → FUNCTIONAL; anyone could be hurt → SAFETY.`;

export async function voiceToSnag(transcript: string): Promise<VoiceToSnagDraft> {
  const res = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: 600,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Transcript:\n"""\n${transcript.trim()}\n"""\n\nReturn the JSON.`,
      },
    ],
  });
  return extractJson<VoiceToSnagDraft>(res);
}
