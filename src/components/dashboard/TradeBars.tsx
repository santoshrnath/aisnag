"use client";

interface Slice {
  tradeName: string;
  count: number;
}

interface Props {
  data: Slice[];
}

const TRADE_COLORS: Record<string, string> = {
  Finishing: "#8b5cf6",
  MEP: "#3b82f6",
  Civil: "#10b981",
  Joinery: "#f59e0b",
  Painting: "#ef4444",
  Flooring: "#6366f1",
  Plumbing: "#06b6d4",
  Electrical: "#eab308",
  Other: "#94a3b8",
};

export function TradeBars({ data }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <ul className="space-y-3">
      {sorted.map((d) => {
        const color = TRADE_COLORS[d.tradeName] ?? "#94a3b8";
        const width = (d.count / max) * 100;
        return (
          <li key={d.tradeName} className="flex items-center gap-3 text-sm">
            <div className="w-20 flex-shrink-0 truncate text-slate-700">{d.tradeName}</div>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
            <div className="w-8 flex-shrink-0 text-right text-sm font-semibold text-ink-900">
              {d.count}
            </div>
          </li>
        );
      })}
      {sorted.length === 0 && (
        <li className="text-sm text-slate-400">No snags yet.</li>
      )}
    </ul>
  );
}
