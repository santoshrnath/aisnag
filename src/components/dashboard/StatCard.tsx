import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number; // % change, positive or negative
  deltaLabel?: string;
  icon?: ReactNode;
  iconClassName?: string;
  href?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last week",
  icon,
  iconClassName,
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        {icon && (
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              iconClassName ?? "bg-slate-100 text-slate-600",
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-ink-900">{value}</div>
      {delta != null && (
        <div className="flex items-center gap-1 text-xs">
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className={positive ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
            {positive ? "+" : ""}
            {delta}%
          </span>
          <span className="text-slate-400">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
