import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { EmptyDrawings } from "@/components/drawing/EmptyDrawings";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusDonut } from "@/components/dashboard/StatusDonut";
import { TradeBars } from "@/components/dashboard/TradeBars";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { MyTasksStrip } from "@/components/dashboard/MyTasksStrip";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import {
  Bell,
  Plus,
  PinIcon,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const project = await getCurrentProject();
  if (!project) return null;

  const [byStatus, byTrade, total, sinceLastWeek, recent, openSnags, drawings] =
    await Promise.all([
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
      prisma.snag.count({ where: { projectId: project.id } }),
      prisma.snag.count({
        where: {
          projectId: project.id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.snag.findMany({
        where: { projectId: project.id },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          drawing: { select: { name: true, level: true } },
          raisedBy: { select: { name: true } },
        },
      }),
      prisma.snag.findMany({
        where: {
          projectId: project.id,
          status: { in: ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION"] },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          trade: true,
          drawing: { select: { id: true, name: true, level: true } },
        },
      }),
      prisma.drawing.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "asc" },
        take: 4,
      }),
    ]);

  const tradeIds = byTrade.map((b) => b.tradeId).filter((x): x is string => !!x);
  const trades = await prisma.trade.findMany({ where: { id: { in: tradeIds } } });
  const tradeName = new Map(trades.map((t) => [t.id, t.name]));

  return {
    project,
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })),
    byTrade: byTrade.map((b) => ({
      tradeName: b.tradeId ? tradeName.get(b.tradeId) ?? "Other" : "Unassigned",
      count: b._count._all,
    })),
    total,
    sinceLastWeek,
    recent,
    openSnags,
    drawings,
  };
}

export default async function DashboardPage() {
  const data = await loadDashboard();
  if (!data) return <EmptyProject />;

  const { project, byStatus, byTrade, total, sinceLastWeek, recent, openSnags, drawings } = data;

  const count = (s: string) => byStatus.find((b) => b.status === s)?.count ?? 0;
  const open = count("OPEN");
  const inProgress = count("IN_PROGRESS");
  const ready = count("READY_FOR_INSPECTION");
  const closed = count("CLOSED");
  const isFreshProject = drawings.length === 0 && total === 0;

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Good day{" "}
            <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here's what's happening on {project.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardSearch projectId={project.id} />
          <button
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 sm:flex"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <Link
            href="/snags/new"
            className="hidden h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 sm:flex"
          >
            <Plus className="h-4 w-4" />
            New Snag
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-6 px-4 py-5 lg:px-8">
        {/* Fresh project? Push the user straight at "upload your first drawing". */}
        {isFreshProject ? (
          <EmptyDrawings projectId={project.id} projectName={project.name} />
        ) : (
          <OnboardingHint />
        )}

        {/* Stat cards — 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Snags"
            value={total}
            delta={sinceLastWeek > 0 && total > sinceLastWeek ? Math.round((sinceLastWeek / Math.max(total - sinceLastWeek, 1)) * 100) : null as any}
            icon={<PinIcon className="h-4 w-4" />}
            iconClassName="bg-brand-50 text-brand-600"
          />
          <StatCard
            label="Open"
            value={open}
            icon={<AlertCircle className="h-4 w-4" />}
            iconClassName="bg-red-50 text-red-600"
          />
          <StatCard
            label="In Progress"
            value={inProgress}
            icon={<Wrench className="h-4 w-4" />}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Ready to Inspect"
            value={ready}
            icon={<Eye className="h-4 w-4" />}
            iconClassName="bg-blue-50 text-blue-600"
          />
        </div>

        {/* Status / Trades / Activity row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Snag Status" subtitle={`${total} total`}>
            <StatusDonut slices={byStatus} total={total} />
          </Panel>
          <Panel title="Snags by Trade" actionHref="/snags" actionLabel="View all">
            <TradeBars data={byTrade} />
          </Panel>
          <Panel title="Recent Activity" actionHref="/snags" actionLabel="View all">
            <ActivityFeed items={recent as any} />
          </Panel>
        </div>

        {/* My Tasks + Drawings preview */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MyTasksStrip snags={openSnags as any} />
          </div>
          <Panel title="Drawings" actionHref="/drawings" actionLabel="See all">
            <ul className="space-y-2.5">
              {drawings.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/drawings/${d.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <PinIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">
                        {d.name}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {d.level ?? "—"} • {d.version}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {drawings.length === 0 && (
                <li className="text-sm text-slate-400">No drawings yet.</li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actionHref && (
          <Link
            href={actionHref}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {actionLabel ?? "View all"}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

