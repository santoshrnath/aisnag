"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  PinIcon,
  Map,
  Check,
  ArrowRight,
  Settings,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { NewProjectDialog } from "@/components/shell/NewProjectDialog";

interface ProjectCard {
  id: string;
  name: string;
  client: string | null;
  developer: string | null;
  contractor: string | null;
  location: string | null;
  coverColor: string | null;
  createdAt: string;
  snagCount: number;
  drawingCount: number;
}

const COOKIE = "snagpin.currentProjectId";

export function ProjectsGrid({
  projects,
  currentId,
}: {
  projects: ProjectCard[];
  currentId: string | null;
}) {
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();

  function makeActive(id: string) {
    document.cookie = `${COOKIE}=${encodeURIComponent(id)}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    router.refresh();
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:flex lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 lg:mt-0"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {projects.map((p) => {
          const active = p.id === currentId;
          return (
            <div
              key={p.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft",
                active ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200",
              )}
            >
              <div
                className="h-2"
                style={{
                  background: `linear-gradient(90deg, ${p.coverColor ?? "#7c3aed"}, #c4b5fd)`,
                }}
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                       style={{ backgroundColor: (p.coverColor ?? "#7c3aed") + "15" }}>
                    <Building2 className="h-5 w-5" style={{ color: p.coverColor ?? "#7c3aed" }} />
                  </div>
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      <Check className="h-3 w-3" />
                      Current
                    </span>
                  )}
                </div>
                <div className="text-base font-semibold text-ink-900">{p.name}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {[p.client, p.location].filter(Boolean).join(" · ") || "—"}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Map className="h-3 w-3" /> Drawings
                    </div>
                    <div className="text-sm font-semibold text-ink-900">{p.drawingCount}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <div className="flex items-center gap-1 text-slate-500">
                      <PinIcon className="h-3 w-3" /> Snags
                    </div>
                    <div className="text-sm font-semibold text-ink-900">{p.snagCount}</div>
                  </div>
                </div>

                <div className="mt-auto pt-4 text-[11px] text-slate-400">
                  Created {formatDate(p.createdAt)}
                </div>
              </div>

              <div className="flex border-t border-slate-100">
                {active ? (
                  <Link
                    href="/"
                    className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    Open dashboard <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <button
                    onClick={() => makeActive(p.id)}
                    className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Switch to this project
                  </button>
                )}
                <Link
                  href="/settings"
                  className="flex items-center justify-center border-l border-slate-100 px-3 text-slate-500 hover:bg-slate-50 hover:text-brand-600"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* New project tile */}
        <button
          onClick={() => setShowNew(true)}
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/40 text-slate-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">New project</div>
          <div className="text-[11px]">Auto-seeds the standard trades.</div>
        </button>
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
    </>
  );
}
