import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusDonut } from "@/components/dashboard/StatusDonut";
import { TradeBars } from "@/components/dashboard/TradeBars";
import { Download, PinIcon, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const project = await getCurrentProject();
  if (!project) return <EmptyProject />;

  const [total, byStatus, byTrade, lastWeek, byDay] = await Promise.all([
    prisma.snag.count({ where: { projectId: project.id } }),
    prisma.snag.groupBy({
      by: ["status"],
      where: { projectId: project.id },
      _count: { _all: true },
    }),
    prisma.snag.groupBy({
      by: ["tradeId"],
      where: { projectId: project.id },
      _count: { _all: true },
    }),
    prisma.snag.count({
      where: {
        projectId: project.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.snag.findMany({
      where: { projectId: project.id },
      select: { createdAt: true, status: true },
    }),
  ]);

  const tradeIds = byTrade.map((b) => b.tradeId).filter((x): x is string => !!x);
  const trades = await prisma.trade.findMany({ where: { id: { in: tradeIds } } });
  const tradeName = new Map(trades.map((t) => [t.id, t.name]));

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const open = count("OPEN");
  const closed = count("CLOSED");

  // Tiny 7-day sparkline data — created snags per day
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    days.push({
      date: start.toLocaleDateString("en-GB", { weekday: "short" }),
      count: byDay.filter((s) => s.createdAt >= start && s.createdAt <= end).length,
    });
  }
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:flex lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">This week's snag health.</p>
        </div>
        <button
          disabled
          title="PDF export coming next"
          className="mt-3 hidden h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm lg:flex"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      <div className="space-y-5 px-4 py-5 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Snags" value={total} icon={<PinIcon className="h-4 w-4" />} iconClassName="bg-brand-50 text-brand-600" />
          <StatCard label="Open" value={open} icon={<AlertCircle className="h-4 w-4" />} iconClassName="bg-red-50 text-red-600" />
          <StatCard label="Closed" value={closed} icon={<CheckCircle2 className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" />
          <StatCard label="Added this week" value={lastWeek} icon={<PinIcon className="h-4 w-4" />} iconClassName="bg-amber-50 text-amber-600" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">Snag Status</h2>
            <StatusDonut
              slices={byStatus.map((b) => ({ status: b.status, count: b._count._all }))}
              total={total}
            />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">By Trade</h2>
            <TradeBars
              data={byTrade.map((b) => ({
                tradeName: b.tradeId ? tradeName.get(b.tradeId) ?? "Other" : "Unassigned",
                count: b._count._all,
              }))}
            />
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Snags added — last 7 days</h2>
          <div className="flex items-end gap-3 sm:gap-4">
            {days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end rounded-lg bg-slate-50">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-brand-500 to-brand-400"
                    style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 6 : 0 }}
                    title={`${d.count} snags`}
                  />
                </div>
                <div className="text-[11px] text-slate-500">{d.date}</div>
                <div className="text-xs font-semibold text-ink-900">{d.count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
