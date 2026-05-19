import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { AppShell } from "@/components/shell/AppShell";
import { Map, PinIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DrawingsPage() {
  const tenantId = currentTenant();
  const project = await prisma.project.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
  if (!project) {
    return (
      <AppShell>
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No project yet. Run <code>npm run seed</code>.
        </div>
      </AppShell>
    );
  }

  const drawings = await prisma.drawing.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          snags: true,
        },
      },
      snags: {
        select: { status: true },
      },
    },
  });

  return (
    <AppShell projectName={project.name}>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Drawings</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {drawings.length} {drawings.length === 1 ? "drawing" : "drawings"} • {project.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {drawings.map((d) => {
          const open = d.snags.filter((s) => s.status !== "CLOSED" && s.status !== "CANCELLED").length;
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
        {drawings.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <Map className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No drawings uploaded yet. Run <code>npm run seed</code> for the demo set, or POST to{" "}
              <code>/api/drawings</code>.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
