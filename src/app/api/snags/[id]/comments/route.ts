import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { indexSnag } from "@/lib/rag/index-snag";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const tenantId = currentTenant();
  const body = await req.json();
  if (!body.text?.trim()) {
    return new NextResponse("text is required", { status: 400 });
  }
  const created = await prisma.snagComment.create({
    data: {
      tenantId,
      snagId: params.id,
      authorId: body.authorId ?? null,
      text: body.text.trim(),
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
  indexSnag(params.id).catch((e) => console.error("[indexSnag]", e));
  return NextResponse.json({ comment: created });
}
