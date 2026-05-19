"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  User,
  Wrench,
  ShieldAlert,
  Loader2,
  Mic,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn, formatDate, severityColor, statusColor, statusLabel, timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { AISparkle } from "@/components/ui/AISparkle";

interface SnagFull {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  trade?: { name: string } | null;
  drawing?: { name: string; level: string | null } | null;
  raisedBy?: { name: string } | null;
  assignedTo?: { id: string; name: string } | null;
  dueDate: string | null;
  createdAt: string;
  aiGenerated: boolean;
  aiSummary: string | null;
  photos: { id: string; url: string; kind: string; caption: string | null }[];
  voiceNotes: { id: string; url: string | null; transcript: string | null; durationMs: number | null }[];
  comments: {
    id: string;
    text: string;
    createdAt: string;
    author?: { name: string } | null;
  }[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY_FOR_INSPECTION", label: "Ready to Inspect" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
];

export function SnagSidePanel({
  snagId,
  onClose,
  onStatusChange,
}: {
  snagId: string;
  onClose: () => void;
  onStatusChange?: () => void;
}) {
  const [snag, setSnag] = useState<SnagFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"details" | "photos" | "activity">("details");
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/snags/${snagId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSnag(j.snag);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [snagId]);

  async function setStatus(s: string) {
    if (!snag) return;
    setUpdating(true);
    const res = await fetch(`/api/snags/${snag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setUpdating(false);
    if (res.ok) {
      setSnag((curr) => (curr ? { ...curr, status: s } : curr));
      onStatusChange?.();
      toast({
        kind: s === "CLOSED" ? "success" : "info",
        title: `Status → ${STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s}`,
        body: snag ? snag.code : undefined,
      });
    } else {
      toast({ kind: "error", title: "Couldn't update status" });
    }
  }

  async function postComment() {
    if (!snag || !comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/snags/${snag.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment }),
    });
    setPosting(false);
    if (res.ok) {
      const j = await res.json();
      setSnag((s) => (s ? { ...s, comments: [...s.comments, j.comment] } : s));
      setComment("");
    }
  }

  const sc = snag ? statusColor(snag.status) : statusColor("OPEN");
  const sv = snag ? severityColor(snag.severity) : severityColor("FUNCTIONAL");

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-pop transition-transform",
          "sm:max-w-md",
          "lg:relative lg:inset-auto lg:z-10 lg:h-auto lg:w-[400px] lg:flex-shrink-0 lg:border-l lg:border-slate-200 lg:shadow-none",
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 pt-safe">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Snag
            </div>
            <div className="truncate text-sm font-semibold text-ink-900">
              {snag?.code ?? "..."}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {snag && (
              <Link
                href={`/snags/${snag.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Open full"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading || !snag ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-base font-semibold text-ink-900">{snag.title}</h2>
              {snag.drawing && (
                <p className="mt-0.5 text-xs text-slate-500">
                  📍 {snag.drawing.level ? `${snag.drawing.level} • ` : ""}{snag.drawing.name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip className={cn(sc.bg, sc.text)}>{statusLabel(snag.status)}</Chip>
                <Chip className={cn(sv.bg, sv.text)}>
                  <ShieldAlert className="h-3 w-3" /> {snag.severity.toLowerCase()}
                </Chip>
                {snag.trade && (
                  <Chip className="bg-slate-100 text-slate-700">
                    <Wrench className="h-3 w-3" /> {snag.trade.name}
                  </Chip>
                )}
                {snag.aiGenerated && <AISparkle />}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-100 px-4">
              <div className="flex gap-1">
                {(["details", "photos", "activity"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "border-b-2 px-3 py-2 text-sm font-medium capitalize transition",
                      tab === t
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {t}
                    {t === "photos" && snag.photos.length > 0 && (
                      <span className="ml-1 text-xs text-slate-400">({snag.photos.length})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {tab === "details" && (
                <div className="space-y-4 text-sm">
                  <DetailRow icon={<Wrench className="h-4 w-4" />} label="Trade" value={snag.trade?.name} />
                  <DetailRow
                    icon={<ShieldAlert className="h-4 w-4" />}
                    label="Severity"
                    value={snag.severity.toLowerCase()}
                  />
                  <DetailRow
                    icon={<User className="h-4 w-4" />}
                    label="Assignee"
                    value={snag.assignedTo?.name ?? "—"}
                  />
                  <DetailRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Due date"
                    value={snag.dueDate ? formatDate(snag.dueDate) : "—"}
                  />

                  {snag.description && (
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Description
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {snag.description}
                      </p>
                    </div>
                  )}

                  {snag.voiceNotes.length > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                        <Mic className="h-3 w-3" /> Voice Note
                      </div>
                      {snag.voiceNotes.map((v) => (
                        <div key={v.id} className="space-y-2 rounded-xl bg-slate-50 p-3">
                          {v.url && <audio controls src={v.url} className="w-full" />}
                          {v.transcript && (
                            <p className="text-xs italic text-slate-600">"{v.transcript}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {snag.raisedBy && (
                    <p className="text-xs text-slate-500">
                      Raised by {snag.raisedBy.name} • {timeAgo(snag.createdAt)}
                    </p>
                  )}
                </div>
              )}

              {tab === "photos" && (
                <div className="grid grid-cols-2 gap-2">
                  {snag.photos.map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption ?? "Snag photo"}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      {p.kind === "closure" && (
                        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          <CheckCircle2 className="h-3 w-3" /> Closure
                        </div>
                      )}
                    </a>
                  ))}
                  {snag.photos.length === 0 && (
                    <div className="col-span-2 rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
                      No photos yet.
                    </div>
                  )}
                </div>
              )}

              {tab === "activity" && (
                <div className="space-y-3">
                  {snag.comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs">
                        <span className="font-medium text-ink-900">
                          {c.author?.name ?? "Anonymous"}
                        </span>
                        <span className="text-slate-400">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{c.text}</p>
                    </div>
                  ))}
                  {snag.comments.length === 0 && (
                    <p className="text-sm text-slate-400">No comments yet.</p>
                  )}
                  <div className="rounded-xl border border-slate-200 p-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment…"
                      className="w-full resize-none border-0 bg-transparent text-sm focus:outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={postComment}
                        disabled={!comment.trim() || posting}
                        className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {posting ? "Posting…" : "Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: status switcher */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 pb-safe">
              <div className="mb-1 text-xs font-medium text-slate-500">Update status</div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => {
                  const active = snag.status === opt.value;
                  const c = statusColor(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !active && setStatus(opt.value)}
                      disabled={updating || active}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        active
                          ? "border-transparent text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                      )}
                      style={active ? { backgroundColor: c.pin } : undefined}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="truncate text-sm font-medium capitalize text-ink-900">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
