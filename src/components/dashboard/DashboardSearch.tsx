"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Loader2, X } from "lucide-react";
import { cn, statusColor, statusLabel } from "@/lib/utils";

interface SearchHit {
  snagId: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  trade: string | null;
  drawingName: string | null;
  room: string | null;
  score: number;
  evidence: string;
  explanation: string | null;
}

export function DashboardSearch({ projectId }: { projectId: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const tRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    clearTimeout(tRef.current);
    if (q.trim().length < 3) {
      setResults([]);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);
    tRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            projectId,
            limit: 8,
            explain: true,
          }),
        });
        if (res.status === 401) {
          setErr("Sign in to run AI search — it uses Anthropic credits.");
          setResults([]);
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setResults(json.results ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(tRef.current);
  }, [q, projectId, open]);

  return (
    <div className="relative w-full max-w-xs sm:w-72">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder='Try "paint defects near windows"'
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && q.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-30 mt-2 w-[92vw] max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-pop sm:w-[28rem]">
            <div className="mb-2 flex items-center gap-2 px-1 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              AI semantic search
              {loading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />}
            </div>
            {err && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {err}
              </div>
            )}
            {!loading && results.length === 0 && q.length >= 3 && !err && (
              <div className="px-2 py-3 text-sm text-slate-500">
                No matches yet. Try a different phrasing.
              </div>
            )}
            {q.length < 3 && (
              <div className="space-y-2 px-2 py-3">
                <p className="text-xs text-slate-500">
                  Type at least 3 characters. Claude reads snag titles,
                  descriptions, comments and voice transcripts.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "paint defects near windows",
                    "loose handles on Level 6",
                    "safety issues",
                    "MEP snags due this week",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQ(s)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ul className="space-y-1.5">
              {results.map((r) => {
                const sc = statusColor(r.status);
                return (
                  <li key={r.snagId}>
                    <Link
                      href={`/snags/${r.snagId}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink-900">
                            {r.code}{" "}
                            <span className="font-normal text-slate-700">{r.title}</span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {r.drawingName ? `${r.drawingName} • ` : ""}
                            {r.trade ?? "—"} •{" "}
                            <span className={cn("font-medium", sc.text)}>
                              {statusLabel(r.status)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          {Math.round(r.score * 100)}%
                        </div>
                      </div>
                      {r.explanation && (
                        <p className="mt-1.5 text-xs italic text-slate-600">
                          {r.explanation}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
