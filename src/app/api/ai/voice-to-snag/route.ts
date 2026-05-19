import { NextResponse } from "next/server";
import { voiceToSnag } from "@/lib/ai/voice-to-snag";
import { requireSignedIn } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  try {
    const body = await req.json();
    const transcript = String(body.transcript ?? "").trim();
    if (!transcript) {
      return new NextResponse("transcript is required", { status: 400 });
    }
    const draft = await voiceToSnag(transcript);
    return NextResponse.json({ draft });
  } catch (e: any) {
    console.error("[voice-to-snag]", e);
    return new NextResponse(`AI voice-to-snag failed: ${e?.message ?? "unknown"}`, {
      status: 500,
    });
  }
}
