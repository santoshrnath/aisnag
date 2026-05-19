"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Building2, PinIcon } from "lucide-react";
import { NewProjectDialog } from "@/components/shell/NewProjectDialog";

const COOKIE = "snagpin.currentProjectId";

// Shown on the dashboard when the tenant has zero projects (e.g. an empty
// install, or a tenant whose only project was deleted). One-action CTA:
// "Create your first project". Everything wires up from there.
export function EmptyProject() {
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop">
          <PinIcon className="h-8 w-8" fill="white" strokeWidth={2.5} />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          Welcome to SnagPin
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          The mobile-first snagging app that drops a pin in 30 seconds and lets
          Claude draft the snag from a photo. Start by creating a project — we'll
          pre-load the standard trades so you can drop snags right away.
        </p>
        <div className="mt-7 flex justify-center gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Building2 className="h-4 w-4" />
            Create your first project
          </button>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Or run <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">npm run seed</code> to
          load the Skyline Residences demo (3 floor plans, 32 snags).
        </p>
      </div>

      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreated={(p) => {
            document.cookie = `${COOKIE}=${encodeURIComponent(p.id)}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
