"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/utils";

interface Activity {
  id: string;
  code: string;
  title: string;
  status: string;
  drawing?: { name: string; level: string | null } | null;
  trade?: { name: string } | null;
  raisedBy?: { name: string } | null;
  updatedAt: string;
}

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <ul className="space-y-3">
      {items.length === 0 && (
        <li className="text-sm text-slate-400">No recent activity yet.</li>
      )}
      {items.map((a) => (
        <li key={a.id}>
          <Link
            href={`/snags/${a.id}`}
            className="-mx-2 block rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink-900">
                  {a.code}{" "}
                  <span className="font-normal text-slate-700">{a.title}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {a.drawing?.level ? `${a.drawing.level} • ` : ""}
                  {a.drawing?.name ?? "—"}
                  {a.raisedBy ? ` • by ${a.raisedBy.name}` : ""}
                  {" • "}
                  {timeAgo(a.updatedAt)}
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
