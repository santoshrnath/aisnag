import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { getStorage, drawingKey } from "@/lib/storage";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const drawings = await prisma.drawing.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { snags: true } } },
  });
  return NextResponse.json({ drawings });
}

// Drawing upload — multipart/form-data with `file`, `projectId`, `name`,
// optional `level`, `type`, `version`.
export async function POST(req: Request) {
  const tenantId = currentTenant();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = String(form.get("projectId") ?? "");
  const name = String(form.get("name") ?? "Untitled drawing");
  const level = (form.get("level") as string) || null;
  const type = (form.get("type") as string) || "FLOOR_PLAN";
  const version = (form.get("version") as string) || "V1";

  if (!file || !projectId) {
    return new NextResponse("file and projectId are required", { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const drawingId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = drawingKey({ tenantId, projectId, drawingId, fileName: safeName });

  await getStorage().put({
    bucket: "drawings",
    key,
    body: buf,
    contentType: file.type || "image/png",
  });

  const created = await prisma.drawing.create({
    data: {
      id: drawingId,
      tenantId,
      projectId,
      name,
      level,
      type: type as any,
      version,
      storageKey: key,
      mimeType: file.type || "image/png",
      sizeBytes: buf.length,
    },
  });

  return NextResponse.json({ drawing: created });
}
