import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      drawings: { orderBy: { createdAt: "asc" } },
      trades: true,
      _count: { select: { snags: true } },
    },
  });
  if (!project) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of [
    "name",
    "client",
    "developer",
    "contractor",
    "location",
    "status",
    "coverColor",
  ]) {
    if (k in body) data[k] = body[k] === "" ? null : body[k];
  }
  if (data.name != null && !String(data.name).trim()) {
    return new NextResponse("Name cannot be empty", { status: 400 });
  }
  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ project: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
