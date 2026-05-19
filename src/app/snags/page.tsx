import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { EmptyDrawings } from "@/components/drawing/EmptyDrawings";
import { cn, formatDate, statusColor, statusLabel, timeAgo } from "@/lib/utils";
import { Filter } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION", "CLOSED"] as const;

export default async function SnagsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const project = await getCurrentProject();
  if (!project) return <EmptyProject />;

  const where: any = { projectId: project.id };
  if (searchParams.status) where.status = searchParams.status;

  const snags = await prisma.snag.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      trade: true,
      drawing: { select: { id: true, name: true, level: true } },
      assignedTo: { select: { name: true } },
    },
  });

  // Project has no drawings → no snags. Show the friendly upload prompt.
  const drawingCount = await prisma.drawing.count({ where: { projectId: project.id } });

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      {drawingCount === 0 && (
        <div className="px-4 pt-5 lg:px-8">
          <EmptyDrawings projectId={project.id} projectName={project.name} />
        </div>
      )}
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Snags</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {snags.length} {snags.length === 1 ? "snag" : "snags"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/snags"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !searchParams.status
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            All
          </Link>
          {STATUSES.map((s) => {
            const sc = statusColor(s);
            const active = searchParams.status === s;
            return (
              <Link
                key={s}
                href={`/snags?status=${s}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                  active
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                style={active ? { backgroundColor: sc.pin } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: active ? "white" : sc.pin }}
                />
                {statusLabel(s)}
              </Link>
            );
          })}
        </div>
      </div>

      <ul className="divide-y divide-slate-100 bg-white">
        {snags.map((s) => {
          const sc = statusColor(s.status);
          return (
            <li key={s.id}>
              <Link
                href={`/snags/${s.id}`}
                className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 lg:px-8"
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: sc.pin }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {s.code} <span className="font-normal text-slate-700">{s.title}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {s.drawing ? `${s.drawing.level ?? "—"} • ${s.drawing.name}` : "—"}
                    {s.trade ? ` • ${s.trade.name}` : ""}
                    {s.assignedTo ? ` • ${s.assignedTo.name}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right text-xs">
                  <span className={cn("font-medium", sc.text)}>{statusLabel(s.status)}</span>
                  <span className="text-slate-400">{timeAgo(s.updatedAt)}</span>
                </div>
              </Link>
            </li>
          );
        })}
        {snags.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-slate-400">No snags match.</li>
        )}
      </ul>
    </AppShell>
  );
}
