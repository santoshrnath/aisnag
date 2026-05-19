import { NextResponse } from "next/server";
import { photoToSnag } from "@/lib/ai/photo-to-snag";
import { requireSignedIn } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const hint = (form.get("hint") as string) || undefined;
    if (!file) return new NextResponse("file is required", { status: 400 });
    if (file.size > 8 * 1024 * 1024) {
      return new NextResponse("Photo too large (max 8MB for AI inspection)", {
        status: 413,
      });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mediaType = (file.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";
    const draft = await photoToSnag({
      imageBase64: buf.toString("base64"),
      mediaType,
      hint,
    });
    return NextResponse.json({ draft });
  } catch (e: any) {
    console.error("[photo-to-snag]", e);
    return new NextResponse(`AI photo-to-snag failed: ${e?.message ?? "unknown"}`, {
      status: 500,
    });
  }
}
