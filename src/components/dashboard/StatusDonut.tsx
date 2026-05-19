"use client";

import { statusColor, statusLabel } from "@/lib/utils";

interface Slice {
  status: string;
  count: number;
}

interface Props {
  slices: Slice[];
  total: number;
}

export function StatusDonut({ slices, total }: Props) {
  // Stable ordering — looks like the screenshot.
  const order = ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION", "CLOSED", "REOPENED", "CANCELLED"];
  const ordered = order
    .map((s) => slices.find((sl) => sl.status === s) ?? { status: s, count: 0 })
    .filter((s) => s.count > 0);

  // Build SVG arcs.
  const R = 56;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative flex h-36 w-36 flex-shrink-0 items-center justify-center">
        <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
          <circle cx="72" cy="72" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {ordered.map((s) => {
            const frac = total > 0 ? s.count / total : 0;
            const len = C * frac;
            const dash = `${len} ${C - len}`;
            const el = (
              <circle
                key={s.status}
                cx="72"
                cy="72"
                r={R}
                fill="none"
                stroke={statusColor(s.status).pin}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold tracking-tight text-ink-900">{total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-2 text-sm sm:flex-1">
        {(ordered.length === 0
          ? [{ status: "OPEN", count: 0 }]
          : ordered
        ).map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <li key={s.status} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-700">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: statusColor(s.status).pin }}
                />
                {statusLabel(s.status)}
              </span>
              <span className="text-slate-500">
                <span className="font-semibold text-ink-900">{s.count}</span> ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
