import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Every fresh project gets the standard GCC trade list pre-populated so
// users can drop snags immediately. They can still edit / add later.
const DEFAULT_TRADES = [
  "MEP",
  "Civil",
  "Finishing",
  "Joinery",
  "Painting",
  "Flooring",
  "Plumbing",
  "Electrical",
  "Other",
];

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
  if (!body?.name?.trim()) {
    return new NextResponse("Project name is required", { status: 400 });
  }
  const tenantId = currentTenant();
  const created = await prisma.project.create({
    data: {
      tenantId,
      name: body.name.trim(),
      client: body.client?.trim() || null,
      developer: body.developer?.trim() || null,
      contractor: body.contractor?.trim() || null,
      location: body.location?.trim() || null,
      status: body.status ?? "active",
      coverColor: body.coverColor ?? "#7c3aed",
      trades: {
        create: DEFAULT_TRADES.map((name) => ({ tenantId, name })),
      },
    },
    include: { trades: true },
  });
  return NextResponse.json({ project: created });
}
