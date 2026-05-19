"use client";

// Lightweight toast system. No dependencies, just a module-level subscriber
// pattern so any component can call `toast(...)` and the host renders it.

import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertCircle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "info" | "error" | "ai";
export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  durationMs?: number;
}

type Listener = (toasts: Toast[]) => void;

let queue: Toast[] = [];
const listeners: Set<Listener> = new Set();

function emit() {
  for (const l of listeners) l(queue.slice());
}

export function toast(t: Omit<Toast, "id">) {
  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const next: Toast = { id, durationMs: 3200, ...t };
  queue = [...queue, next];
  emit();
  setTimeout(() => dismiss(id), next.durationMs);
}

export function dismiss(id: string) {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const l: Listener = (q) => setToasts(q);
    listeners.add(l);
    setToasts(queue.slice());
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-6 sm:top-6 sm:items-start sm:px-0">
      {toasts.map((t) => {
        const Icon =
          t.kind === "success"
            ? CheckCircle2
            : t.kind === "error"
            ? AlertCircle
            : t.kind === "ai"
            ? Sparkles
            : Info;
        const tone =
          t.kind === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : t.kind === "error"
            ? "border-rose-200 bg-rose-50 text-rose-900"
            : t.kind === "ai"
            ? "border-brand-200 bg-gradient-to-r from-brand-50 to-white text-brand-900"
            : "border-slate-200 bg-white text-slate-900";
        const iconTone =
          t.kind === "success"
            ? "text-emerald-500"
            : t.kind === "error"
            ? "text-rose-500"
            : t.kind === "ai"
            ? "text-brand-500"
            : "text-slate-500";
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-pop animate-slide-up",
              tone,
            )}
          >
            <div className={cn("mt-0.5 flex-shrink-0", iconTone)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.body && <div className="mt-0.5 text-xs opacity-80">{t.body}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md opacity-60 hover:bg-black/5 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
