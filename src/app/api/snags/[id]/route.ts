import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { getStorage } from "@/lib/storage";
import { indexSnag } from "@/lib/rag/index-snag";
import { getVectorService } from "@/lib/vector";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const snag = await prisma.snag.findUnique({
    where: { id: params.id },
    include: {
      trade: true,
      drawing: { select: { id: true, name: true, level: true } },
      project: { select: { id: true, name: true } },
      raisedBy: { select: { id: true, name: true, avatarUrl: true, role: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true, role: true } },
      photos: { orderBy: { uploadedAt: "asc" } },
      voiceNotes: { orderBy: { uploadedAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!snag) return new NextResponse("Not found", { status: 404 });

  const storage = getStorage();
  const photos = await Promise.all(
    snag.photos.map(async (p) => ({
      ...p,
      url: await storage.signedUrl(p.storageKey, "photos", 3600),
    })),
  );
  const voiceNotes = await Promise.all(
    snag.voiceNotes.map(async (v) => ({
      ...v,
      url: await storage.signedUrl(v.storageKey, "audio", 3600),
    })),
  );

  return NextResponse.json({ snag: { ...snag, photos, voiceNotes } });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const tenantId = currentTenant();
  const body = await req.json();

  const before = await prisma.snag.findUnique({ where: { id: params.id } });
  if (!before) return new NextResponse("Not found", { status: 404 });

  const data: any = {};
  for (const k of [
    "title",
    "description",
    "severity",
    "priority",
    "tradeId",
    "assignedToId",
    "dueDate",
    "pinX",
    "pinY",
    "room",
    "area",
    "aiSummary",
  ]) {
    if (k in body) data[k] = k === "dueDate" && body[k] ? new Date(body[k]) : body[k];
  }

  let statusChanged = false;
  if (body.status && body.status !== before.status) {
    data.status = body.status;
    statusChanged = true;
    if (body.status === "CLOSED") {
      data.closedAt = new Date();
      data.closedById = body.actorId ?? null;
    }
  }

  const updated = await prisma.snag.update({
    where: { id: params.id },
    data,
  });

  if (statusChanged) {
    await prisma.snagStatusEvent.create({
      data: {
        tenantId,
        snagId: params.id,
        actorId: body.actorId ?? null,
        fromStatus: before.status,
        toStatus: updated.status,
        note: body.statusNote ?? null,
      },
    });
  }

  indexSnag(params.id).catch((e) => console.error("[indexSnag]", e));

  return NextResponse.json({ snag: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenantId = currentTenant();
  try {
    const vector = await getVectorService();
    await vector.deleteBySnag(tenantId, params.id);
  } catch (e) {
    console.error("[vector delete]", e);
  }
  await prisma.snag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
