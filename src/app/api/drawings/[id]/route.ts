import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const drawing = await prisma.drawing.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      snags: {
        orderBy: { createdAt: "asc" },
        include: {
          trade: true,
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { photos: true, comments: true } },
        },
      },
    },
  });
  if (!drawing) return new NextResponse("Not found", { status: 404 });

  const imageUrl = await getStorage().signedUrl(drawing.storageKey, "drawings", 3600);

  return NextResponse.json({ drawing, imageUrl });
}
