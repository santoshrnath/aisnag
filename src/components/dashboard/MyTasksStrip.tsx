"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, formatDate, priorityColor, statusColor, statusLabel } from "@/lib/utils";

interface Snag {
  id: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  priority: string;
  dueDate: string | null;
  drawing?: { id: string; name: string; level: string | null } | null;
  trade?: { name: string } | null;
}

function dueChip(due: string | null) {
  if (!due) return { label: "—", className: "text-slate-500" };
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: "Overdue", className: "text-rose-600 font-semibold" };
  if (days === 0) return { label: "Today", className: "text-rose-600 font-semibold" };
  if (days === 1) return { label: "Tomorrow", className: "text-amber-600 font-medium" };
  if (days <= 7) return { label: formatDate(due), className: "text-amber-600 font-medium" };
  return { label: formatDate(due), className: "text-slate-600" };
}

export function MyTasksStrip({ snags }: { snags: Snag[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 lg:p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-ink-900">My Tasks</h2>
          <div className="flex gap-1.5 text-xs">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
              All {snags.length}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              Open {snags.filter((s) => s.status === "OPEN").length}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              In Progress {snags.filter((s) => s.status === "IN_PROGRESS").length}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              Overdue {snags.filter((s) => s.dueDate && new Date(s.dueDate) < new Date()).length}
            </span>
          </div>
        </div>
        <Link href="/tasks" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          See all
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <th className="px-5 py-2 font-medium">Snag</th>
              <th className="px-5 py-2 font-medium">Location</th>
              <th className="px-5 py-2 font-medium">Trade</th>
              <th className="px-5 py-2 font-medium">Due</th>
              <th className="px-5 py-2 font-medium">Priority</th>
              <th className="px-5 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {snags.map((s) => {
              const sc = statusColor(s.status);
              const due = dueChip(s.dueDate);
              const pc = priorityColor(s.priority);
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/snags/${s.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: sc.pin }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-900">
                          {s.code} <span className="font-normal text-slate-700">{s.title}</span>
                        </div>
                        <div className={cn("text-xs", sc.text)}>{statusLabel(s.status)}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {s.drawing ? `${s.drawing.level ?? "—"} • ${s.drawing.name}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.trade?.name ?? "—"}</td>
                  <td className={cn("px-5 py-3", due.className)}>{due.label}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", pc.bg, pc.text)}>
                      {s.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/snags/${s.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {snags.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                  Nothing to do. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {snags.map((s) => {
          const sc = statusColor(s.status);
          const due = dueChip(s.dueDate);
          return (
            <li key={s.id}>
              <Link href={`/snags/${s.id}`} className="block px-4 py-3 active:bg-slate-50">
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
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
                      <span className={due.className}>{due.label}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {snags.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">Nothing to do. 🎉</li>
        )}
      </ul>
    </section>
  );
}
