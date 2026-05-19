// Local-storage proxy. When STORAGE_PROVIDER=local, signedUrl() returns
// /api/storage/<bucket>?key=... — this route streams the file back.
// In production (S3) clients hit Hetzner's signed URLs directly.

import { NextResponse } from "next/server";
import { getStorage, type BucketName } from "@/lib/storage";

const ALLOWED: BucketName[] = ["drawings", "photos", "audio"];

export async function GET(
  req: Request,
  { params }: { params: { bucket: string } },
) {
  const bucket = params.bucket as BucketName;
  if (!ALLOWED.includes(bucket)) {
    return new NextResponse("Bad bucket", { status: 400 });
  }
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return new NextResponse("Missing key", { status: 400 });

  try {
    const buf = await getStorage().get(key, bucket);
    // File-extension wins. Falls back to a bucket-appropriate default if
    // the key has no recognised extension.
    const lower = key.toLowerCase();
    let contentType: string;
    if (lower.endsWith(".svg")) contentType = "image/svg+xml";
    else if (lower.endsWith(".pdf")) contentType = "application/pdf";
    else if (lower.endsWith(".png")) contentType = "image/png";
    else if (lower.endsWith(".webp")) contentType = "image/webp";
    else if (lower.endsWith(".gif")) contentType = "image/gif";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lower.endsWith(".webm")) contentType = "audio/webm";
    else if (lower.endsWith(".mp3")) contentType = "audio/mpeg";
    else if (lower.endsWith(".wav")) contentType = "audio/wav";
    else
      contentType =
        bucket === "drawings"
          ? "image/png"
          : bucket === "audio"
          ? "audio/webm"
          : "image/jpeg";
    // NextResponse wants a BodyInit. Buffer extends Uint8Array, which is a
    // valid ArrayBufferView body, but the typings in this TS lib don't match
    // perfectly across Node/Web — cast to BodyInit.
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return new NextResponse("Not found", { status: 404 });
  }
}
