import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { indexSnag } from "@/lib/rag/index-snag";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const drawingId = url.searchParams.get("drawingId");
  const status = url.searchParams.get("status");
  const assignedToId = url.searchParams.get("assignedToId");
  const overdue = url.searchParams.get("overdue") === "true";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (drawingId) where.drawingId = drawingId;
  if (status) where.status = status;
  if (assignedToId) where.assignedToId = assignedToId;
  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  }

  const snags = await prisma.snag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      trade: true,
      drawing: { select: { id: true, name: true, level: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      raisedBy: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { photos: true, comments: true } },
    },
  });

  return NextResponse.json({ snags });
}

// Generate a fresh code per project (SN-001, SN-002, ...)
async function nextCode(projectId: string): Promise<string> {
  const last = await prisma.snag.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  const lastN = last?.code?.match(/SN-(\d+)/)?.[1];
  const n = lastN ? Number(lastN) + 1 : 1;
  return `SN-${String(n).padStart(3, "0")}`;
}

export async function POST(req: Request) {
  const tenantId = currentTenant();
  const body = await req.json();

  if (!body.projectId || !body.drawingId || body.pinX == null || body.pinY == null || !body.title) {
    return new NextResponse(
      "projectId, drawingId, pinX, pinY and title are required",
      { status: 400 },
    );
  }

  const code = await nextCode(body.projectId);

  const created = await prisma.snag.create({
    data: {
      tenantId,
      projectId: body.projectId,
      drawingId: body.drawingId,
      code,
      pinX: body.pinX,
      pinY: body.pinY,
      room: body.room ?? null,
      area: body.area ?? null,
      title: body.title,
      description: body.description ?? null,
      severity: body.severity ?? "FUNCTIONAL",
      priority: body.priority ?? "MEDIUM",
      status: body.status ?? "OPEN",
      tradeId: body.tradeId ?? null,
      raisedById: body.raisedById ?? null,
      assignedToId: body.assignedToId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      aiGenerated: !!body.aiGenerated,
      aiSummary: body.aiSummary ?? null,
    },
    include: {
      trade: true,
      drawing: { select: { id: true, name: true, level: true } },
    },
  });

  // Status event for the audit trail.
  await prisma.snagStatusEvent.create({
    data: {
      tenantId,
      snagId: created.id,
      actorId: body.raisedById ?? null,
      toStatus: created.status,
      note: "Snag raised",
    },
  });

  // Index for RAG search — fire-and-forget so the user isn't blocked.
  // (Errors surface in server logs but don't fail the request.)
  indexSnag(created.id).catch((e) => console.error("[indexSnag]", e));

  return NextResponse.json({ snag: created });
}
