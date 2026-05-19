import { NextResponse } from "next/server";
import { searchSnags } from "@/lib/ai/semantic-search";
import { requireSignedIn } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireSignedIn();
  if (gate) return gate;
  try {
    const body = await req.json();
    const query = String(body.query ?? "").trim();
    if (!query) return new NextResponse("query is required", { status: 400 });

    const results = await searchSnags({
      query,
      projectId: body.projectId ?? undefined,
      statuses: body.statuses ?? undefined,
      severities: body.severities ?? undefined,
      trades: body.trades ?? undefined,
      limit: body.limit ?? 12,
      explain: body.explain ?? true,
    });
    return NextResponse.json({ results });
  } catch (e: any) {
    console.error("[search]", e);
    return new NextResponse(`Search failed: ${e?.message ?? "unknown"}`, {
      status: 500,
    });
  }
}
