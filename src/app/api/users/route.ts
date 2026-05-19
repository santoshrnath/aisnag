import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenantId = currentTenant();
  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}
