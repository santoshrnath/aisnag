"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface Props {
  onClose: () => void;
  onCreated: (project: { id: string; name: string }) => void;
}

export function NewProjectDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [developer, setDeveloper] = useState("");
  const [contractor, setContractor] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim(),
          developer: developer.trim(),
          contractor: contractor.trim(),
          location: location.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { project } = await res.json();
      toast({
        kind: "success",
        title: `Project "${project.name}" created`,
        body: "9 default trades pre-populated. Upload a drawing to start dropping snags.",
      });
      onCreated(project);
    } catch (e: any) {
      toast({ kind: "error", title: "Couldn't create project", body: e?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-none sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 pt-safe">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="text-base font-semibold text-ink-900">New project</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-brand-800">
            <Sparkles className="mr-1 inline h-3 w-3" />
            We'll pre-populate the standard trades (MEP, Civil, Finishing, …) so you can
            start dropping snags right away.
          </p>

          <Field label="Project name *" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marina Towers — Phase 2"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Client">
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Emaar"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Developer">
              <input
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Aurora Developments"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Main contractor">
              <input
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="e.g. Crestline Constructions"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Location">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dubai Marina"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3 pb-safe">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create project
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
