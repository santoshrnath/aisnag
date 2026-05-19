import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { AppShell } from "@/components/shell/AppShell";
import { ArrowLeft, Map } from "lucide-react";
import { SnagDetailClient } from "./SnagDetailClient";

export const dynamic = "force-dynamic";

export default async function SnagDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const snag = await prisma.snag.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      drawing: { select: { id: true, name: true, level: true, storageKey: true } },
      trade: true,
      raisedBy: { select: { id: true, name: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      photos: { orderBy: { uploadedAt: "asc" } },
      voiceNotes: { orderBy: { uploadedAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!snag) notFound();

  const storage = getStorage();
  const drawingUrl = snag.drawing
    ? await storage.signedUrl(snag.drawing.storageKey, "drawings", 3600)
    : null;
  const photos = await Promise.all(
    snag.photos.map(async (p) => ({
      ...p,
      url: await storage.signedUrl(p.storageKey, "photos", 3600),
    })),
  );
  const voiceNotes = await Promise.all(
    snag.voiceNotes.map(async (v) => {
      const playable = v.storageKey && !v.storageKey.startsWith("__seed_");
      return {
        ...v,
        url: playable ? await storage.signedUrl(v.storageKey, "audio", 3600) : null,
      };
    }),
  );

  return (
    <AppShell projectName={snag.project.name}>
      <div className="border-b border-slate-200 bg-white px-4 py-4 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/drawings/${snag.drawing?.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {snag.code}
            </div>
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">
              {snag.title}
            </h1>
          </div>
          {snag.drawing && (
            <Link
              href={`/drawings/${snag.drawing.id}`}
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <Map className="h-4 w-4" />
              View on drawing
            </Link>
          )}
        </div>
      </div>

      <SnagDetailClient
        snag={{
          ...snag,
          photos,
          voiceNotes,
          drawingUrl,
        } as any}
      />
    </AppShell>
  );
}
