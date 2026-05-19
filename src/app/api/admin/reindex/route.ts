// Reindex every snag in the current tenant into the vector store.
// Used after a fresh deploy or any time the embedding model / chunker
// changes. No auth in the POC — wire this behind an auth check before
// going multi-tenant.
//
//   curl -X POST https://aisnag.oneplaceplatform.com/api/admin/reindex

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { indexSnag } from "@/lib/rag/index-snag";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const tenantId = currentTenant();
  const snags = await prisma.snag.findMany({
    where: { tenantId },
    select: { id: true },
  });

  let ok = 0;
  const failures: { id: string; error: string }[] = [];
  for (const { id } of snags) {
    try {
      await indexSnag(id);
      ok += 1;
    } catch (e: any) {
      failures.push({ id, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json({
    total: snags.length,
    indexed: ok,
    failures,
  });
}
