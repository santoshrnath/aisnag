import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const projectId = params.id;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return new NextResponse("Not found", { status: 404 });

  const [byStatus, byTrade, total, sinceLastWeek, recentActivity] = await Promise.all([
    prisma.snag.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.snag.groupBy({
      by: ["tradeId"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.snag.count({ where: { projectId } }),
    prisma.snag.count({
      where: {
        projectId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.snag.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        drawing: { select: { name: true, level: true } },
        trade: { select: { name: true } },
        raisedBy: { select: { name: true } },
      },
    }),
  ]);

  // Map tradeId → name
  const tradeIds = byTrade.map((b) => b.tradeId).filter((x): x is string => !!x);
  const trades = await prisma.trade.findMany({ where: { id: { in: tradeIds } } });
  const tradeNameById = new Map(trades.map((t) => [t.id, t.name]));

  return NextResponse.json({
    project,
    total,
    sinceLastWeek,
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })),
    byTrade: byTrade.map((b) => ({
      tradeId: b.tradeId,
      tradeName: b.tradeId ? tradeNameById.get(b.tradeId) ?? "Other" : "Unassigned",
      count: b._count._all,
    })),
    recentActivity,
  });
}
