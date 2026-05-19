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
