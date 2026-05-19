import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return new NextResponse("projectId required", { status: 400 });
  const trades = await prisma.trade.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ trades });
}
