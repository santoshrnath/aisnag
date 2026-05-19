import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { AppShell } from "@/components/shell/AppShell";
import { cn, formatDate, priorityColor, statusColor, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
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

  const tab = (searchParams.tab as string) ?? "due";

  const where: any = {
    projectId: project.id,
    status: { in: ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION"] },
  };

  if (tab === "overdue") {
    where.dueDate = { lt: new Date() };
  } else if (tab === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  }

  const snags = await prisma.snag.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    take: 200,
    include: {
      trade: true,
      drawing: { select: { id: true, name: true, level: true } },
    },
  });

  const counts = await Promise.all([
    prisma.snag.count({
      where: {
        projectId: project.id,
        status: { in: ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION"] },
      },
    }),
    prisma.snag.count({
      where: {
        projectId: project.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const TABS = [
    { key: "due", label: `Due (${counts[0]})` },
    { key: "today", label: "Today" },
    { key: "overdue", label: `Overdue (${counts[1]})` },
  ];

  return (
    <AppShell projectName={project.name}>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">My Tasks</h1>
        <p className="mt-0.5 text-sm text-slate-500">Open snags across the project.</p>
        <div className="mt-4 flex items-center gap-1.5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/tasks?tab=${t.key}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                tab === t.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-slate-100 bg-white">
        {snags.map((s) => {
          const sc = statusColor(s.status);
          const pc = priorityColor(s.priority);
          const overdue = s.dueDate && new Date(s.dueDate) < new Date();
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
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className={cn("font-medium", sc.text)}>{statusLabel(s.status)}</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={cn(
                        overdue ? "font-semibold text-rose-600" : "text-slate-600",
                      )}
                    >
                      {s.dueDate ? formatDate(s.dueDate) : "No due date"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", pc.bg, pc.text)}>
                      {s.priority}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {snags.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-slate-400">
            Nothing to do. 🎉
          </li>
        )}
      </ul>
    </AppShell>
  );
}
