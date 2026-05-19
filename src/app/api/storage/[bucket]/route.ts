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
    const contentType =
      bucket === "drawings"
        ? key.endsWith(".pdf")
          ? "application/pdf"
          : key.endsWith(".svg")
          ? "image/svg+xml"
          : "image/png"
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
