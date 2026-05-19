import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { EmptyDrawings } from "@/components/drawing/EmptyDrawings";
import { ArrowLeft, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewSnagPage() {
  const project = await getCurrentProject();
  if (!project) return <EmptyProject />;

  const drawings = await prisma.drawing.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <div className="flex items-start gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">New Snag</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Pick the drawing you're walking, then tap to drop a pin.
            </p>
          </div>
        </div>
      </div>

      {drawings.length === 0 && (
        <div className="px-4 py-5 lg:px-8">
          <EmptyDrawings projectId={project.id} projectName={project.name} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {drawings.map((d) => (
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
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink-900">{d.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {d.level ?? "—"} • {d.version}
                </div>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                <MapPin className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
