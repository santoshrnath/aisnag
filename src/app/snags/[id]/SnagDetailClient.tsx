"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  ShieldAlert,
  Wrench,
  User,
  Calendar,
  CheckCircle2,
  Camera,
} from "lucide-react";
import {
  cn,
  formatDate,
  severityColor,
  statusColor,
  statusLabel,
  timeAgo,
} from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { AISparkle } from "@/components/ui/AISparkle";

interface SnagFull {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  priority: string;
  pinX: number;
  pinY: number;
  room: string | null;
  trade?: { name: string } | null;
  drawing?: { id: string; name: string; level: string | null } | null;
  drawingUrl?: string | null;
  raisedBy?: { name: string } | null;
  assignedTo?: { name: string } | null;
  dueDate: string | null;
  createdAt: string;
  aiGenerated: boolean;
  aiSummary: string | null;
  photos: { id: string; url: string; kind: string; caption: string | null }[];
  voiceNotes: { id: string; url: string | null; transcript: string | null }[];
  comments: {
    id: string;
    text: string;
    createdAt: string;
    author?: { name: string } | null;
  }[];
  events: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    actor?: { name: string } | null;
  }[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY_FOR_INSPECTION", label: "Ready to Inspect" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
];

export function SnagDetailClient({ snag: initial }: { snag: SnagFull }) {
  const [snag, setSnag] = useState(initial);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const sc = statusColor(snag.status);
  const sv = severityColor(snag.severity);

  async function setStatus(s: string) {
    const res = await fetch(`/api/snags/${snag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (res.ok) {
      setSnag((c) => ({ ...c, status: s }));
      toast({
        kind: s === "CLOSED" ? "success" : "info",
        title: `Status → ${STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s}`,
        body: snag.code,
      });
    } else {
      toast({ kind: "error", title: "Couldn't update status" });
    }
  }

  async function uploadClosurePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const f = new FormData();
    f.append("file", file);
    f.append("kind", "closure");
    const res = await fetch(`/api/snags/${snag.id}/photos`, { method: "POST", body: f });
    if (res.ok) {
      const j = await res.json();
      setSnag((c) => ({ ...c, photos: [...c.photos, j.photo] }));
      toast({ kind: "success", title: "Closure photo added" });
    } else {
      toast({ kind: "error", title: "Photo upload failed" });
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/snags/${snag.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment }),
    });
    setPosting(false);
    if (res.ok) {
      const j = await res.json();
      setSnag((c) => ({ ...c, comments: [...c.comments, j.comment] }));
      setComment("");
      toast({ kind: "info", title: "Comment posted" });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-3 lg:px-8">
      {/* Main column */}
      <div className="space-y-5 lg:col-span-2">
        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          <Chip className={cn(sc.bg, sc.text)}>{statusLabel(snag.status)}</Chip>
          <Chip className={cn(sv.bg, sv.text)}>
            <ShieldAlert className="h-3 w-3" /> {snag.severity.toLowerCase()}
          </Chip>
          {snag.trade && (
            <Chip className="bg-slate-100 text-slate-700">
              <Wrench className="h-3 w-3" /> {snag.trade.name}
            </Chip>
          )}
          {snag.aiGenerated && <AISparkle label="AI-assisted" />}
        </div>

        {/* Description */}
        {snag.description && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-2 text-sm font-semibold text-ink-900">Description</h2>
            <p className="text-sm leading-relaxed text-slate-700">{snag.description}</p>
            {snag.aiGenerated && snag.aiSummary && snag.aiSummary !== snag.description && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs italic text-brand-700">
                ✦ AI summary: {snag.aiSummary}
              </p>
            )}
          </section>
        )}

        {/* Voice notes */}
        {snag.voiceNotes.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Mic className="h-4 w-4" /> Voice Note
            </h2>
            {snag.voiceNotes.map((v) => (
              <div key={v.id} className="space-y-2">
                {v.url && <audio controls src={v.url} className="w-full" />}
                {v.transcript && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-700">
                    "{v.transcript}"
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Photos */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">
              Photos
              {snag.photos.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-slate-500">
                  ({snag.photos.length})
                </span>
              )}
            </h2>
            <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Closure photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={uploadClosurePhoto}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
                <Camera className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                No photos yet.
              </div>
            )}
          </div>
        </section>

        {/* Comments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">
            Comments
            {snag.comments.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                ({snag.comments.length})
              </span>
            )}
          </h2>
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
                rows={2}
                className="w-full resize-none border-0 bg-transparent text-sm focus:outline-none"
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
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {snag.drawingUrl && snag.drawing && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <Link href={`/drawings/${snag.drawing.id}`} className="block">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-slate-50 bg-dotted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snag.drawingUrl} alt="" className="h-full w-full object-contain" />
                <div
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${snag.pinX * 100}%`,
                    top: `${snag.pinY * 100}%`,
                  }}
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                    style={{ backgroundColor: sc.pin }}
                  >
                    {snag.code.replace(/^SN-?/, "").slice(0, 3)}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs text-slate-500">Drawing</div>
                <div className="truncate text-sm font-semibold text-ink-900">
                  {snag.drawing.level ? `${snag.drawing.level} • ` : ""}{snag.drawing.name}
                </div>
              </div>
            </Link>
          </section>
        )}

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <DetailRow icon={<Wrench className="h-4 w-4" />} label="Trade" value={snag.trade?.name} />
          <DetailRow
            icon={<User className="h-4 w-4" />}
            label="Assignee"
            value={snag.assignedTo?.name}
          />
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Due date"
            value={snag.dueDate ? formatDate(snag.dueDate) : null}
          />
          <DetailRow
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Severity"
            value={snag.severity.toLowerCase()}
          />
          {snag.raisedBy && (
            <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
              Raised by {snag.raisedBy.name} • {timeAgo(snag.createdAt)}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Update status</h2>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const active = snag.status === opt.value;
              const c = statusColor(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => !active && setStatus(opt.value)}
                  disabled={active}
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
        </section>

        {snag.events.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">History</h2>
            <ol className="space-y-3 text-sm">
              {snag.events.map((e) => {
                const c = statusColor(e.toStatus);
                return (
                  <li key={e.id} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: c.pin }}
                    />
                    <div>
                      <div className="text-xs text-slate-700">
                        {e.fromStatus ? `${statusLabel(e.fromStatus)} → ` : ""}
                        <span className="font-medium text-ink-900">
                          {statusLabel(e.toStatus)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {e.actor?.name ?? "System"} • {timeAgo(e.createdAt)}
                      </div>
                      {e.note && <p className="mt-1 text-xs text-slate-600">{e.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </div>
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
