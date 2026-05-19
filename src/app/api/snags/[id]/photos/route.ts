import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { getStorage, photoKey } from "@/lib/storage";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const tenantId = currentTenant();
  const snag = await prisma.snag.findUnique({
    where: { id: params.id },
    select: { id: true, projectId: true },
  });
  if (!snag) return new NextResponse("Not found", { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kind = (form.get("kind") as string) ?? "evidence";
  const caption = (form.get("caption") as string) || null;

  if (!file) return new NextResponse("file is required", { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const safe = (file.name || `photo-${randomUUID()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = photoKey({
    tenantId,
    projectId: snag.projectId,
    snagId: snag.id,
    fileName: `${randomUUID()}-${safe}`,
  });

  await getStorage().put({
    bucket: "photos",
    key,
    body: buf,
    contentType: file.type || "image/jpeg",
  });

  const photo = await prisma.snagPhoto.create({
    data: {
      tenantId,
      snagId: snag.id,
      storageKey: key,
      mimeType: file.type || "image/jpeg",
      sizeBytes: buf.length,
      kind,
      caption,
    },
  });

  const url = await getStorage().signedUrl(key, "photos", 3600);
  return NextResponse.json({ photo: { ...photo, url } });
}
