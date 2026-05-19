"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Plus, Loader2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewProjectDialog } from "@/components/shell/NewProjectDialog";

interface ProjectLite {
  id: string;
  name: string;
  client?: string | null;
  _count?: { snags: number; drawings: number };
}

interface Props {
  currentId: string | null;
  currentName: string;
  currentClient?: string | null;
}

const COOKIE = "snagpin.currentProjectId";

function setProjectCookie(id: string) {
  // ~1 year, path=/, no domain so it scopes to the current host
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function ProjectSwitcher({ currentId, currentName, currentClient }: Props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((j) => setProjects(j.projects ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function selectProject(id: string) {
    setProjectCookie(id);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition",
            open
              ? "border-brand-300 ring-2 ring-brand-100"
              : "border-slate-200 hover:border-slate-300",
          )}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Project
            </div>
            <div className="truncate text-sm font-semibold text-ink-900">
              {currentName}
            </div>
            {currentClient && (
              <div className="truncate text-[11px] text-slate-500">{currentClient}</div>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-slate-400 transition",
              open && "rotate-180 text-brand-600",
            )}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop animate-fade-in">
            <div className="max-h-60 overflow-y-auto p-1">
              {loading && (
                <div className="flex items-center justify-center px-3 py-6 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {projects?.map((p) => {
                const active = p.id === currentId;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition",
                      active ? "bg-brand-50" : "hover:bg-slate-50",
                    )}
                  >
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "truncate text-sm font-medium",
                          active ? "text-brand-700" : "text-ink-900",
                        )}
                      >
                        {p.name}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {p._count?.drawings ?? 0} drawings · {p._count?.snags ?? 0} snags
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />}
                  </button>
                );
              })}
              {!loading && (projects?.length ?? 0) === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No projects yet — create your first one.
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowNew(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                New project
              </button>
              <Link
                href="/projects"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FolderOpen className="h-4 w-4 text-slate-400" />
                See all projects
              </Link>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreated={(p) => {
            setProjectCookie(p.id);
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
