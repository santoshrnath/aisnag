import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { EmptyDrawings } from "@/components/drawing/EmptyDrawings";
import { DrawingsHeader } from "@/components/drawing/DrawingsHeader";
import { PinIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DrawingsPage() {
  const project = await getCurrentProject();
  if (!project) return <EmptyProject />;

  const drawings = await prisma.drawing.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { snags: true } },
      snags: { select: { status: true } },
    },
  });

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      <DrawingsHeader
        projectId={project.id}
        projectName={project.name}
        count={drawings.length}
      />

      {drawings.length === 0 ? (
        <div className="px-4 py-5 lg:px-8">
          <EmptyDrawings projectId={project.id} projectName={project.name} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {drawings.map((d) => {
            const open = d.snags.filter(
              (s) => s.status !== "CLOSED" && s.status !== "CANCELLED",
            ).length;
            return (
              <Link
                key={d.id}
                href={`/drawings/${d.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="relative flex aspect-video items-center justify-center bg-slate-50 bg-dotted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/storage/drawings?key=${encodeURIComponent(d.storageKey)}`}
                    alt={d.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                  <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                    {d.version}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink-900">{d.name}</div>
                    <div className="truncate text-xs text-slate-500">{d.level ?? d.type}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <PinIcon className="h-3 w-3" /> {open}/{d._count.snags}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
