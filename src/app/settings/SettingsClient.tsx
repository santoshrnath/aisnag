"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, Wrench, Building2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Project {
  id: string;
  name: string;
  client: string | null;
  developer: string | null;
  contractor: string | null;
  location: string | null;
  status: string;
}

interface Trade {
  id: string;
  name: string;
}

export function SettingsClient({
  project,
  trades,
}: {
  project: Project;
  trades: Trade[];
}) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client ?? "");
  const [developer, setDeveloper] = useState(project.developer ?? "");
  const [contractor, setContractor] = useState(project.contractor ?? "");
  const [location, setLocation] = useState(project.location ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function save() {
    if (!name.trim()) {
      toast({ kind: "error", title: "Name can't be empty" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
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
      toast({ kind: "success", title: "Project saved" });
      router.refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Save failed", body: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    const ok = confirm(
      `Delete "${project.name}"? This removes every drawing, snag, photo, comment and vector index for the project. Cannot be undone.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      document.cookie = "snagpin.currentProjectId=; max-age=0; path=/";
      toast({ kind: "info", title: "Project deleted" });
      router.push("/");
      router.refresh();
    } catch (e: any) {
      toast({ kind: "error", title: "Delete failed", body: e?.message });
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Edit the current project.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:px-8">
        {/* Project details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-ink-900">Project details</h2>
          </div>
          <Field label="Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Client">
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Developer">
              <input
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Main contractor">
              <input
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <Field label="Location">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </section>

        {/* Trades */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-ink-900">Trades</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Pre-populated from the standard GCC list when this project was created.
            Inline trade editing ships in v2 — for now, every snag picks from these.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trades.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {t.name}
              </span>
            ))}
            {trades.length === 0 && (
              <span className="text-xs text-slate-400">No trades configured.</span>
            )}
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-card lg:p-6">
          <h2 className="mb-1.5 text-sm font-semibold text-rose-900">Danger zone</h2>
          <p className="text-xs text-rose-800/80">
            Delete this project, every drawing, every snag, every photo, every
            comment, and the vector index. Cannot be undone.
          </p>
          <div className="mt-4">
            <button
              onClick={del}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete project
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
