import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenantId = currentTenant();
  const projects = await prisma.project.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { snags: true, drawings: true } },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const tenantId = currentTenant();
  const created = await prisma.project.create({
    data: {
      tenantId,
      name: body.name,
      client: body.client ?? null,
      developer: body.developer ?? null,
      contractor: body.contractor ?? null,
      location: body.location ?? null,
      status: body.status ?? "active",
      coverColor: body.coverColor ?? null,
    },
  });
  return NextResponse.json({ project: created });
}
