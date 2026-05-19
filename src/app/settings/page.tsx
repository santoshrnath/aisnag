import { AppShell } from "@/components/shell/AppShell";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Project and account configuration.</p>
      </div>
      <div className="mx-auto max-w-md px-6 py-12 text-center text-sm text-slate-500">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <SettingsIcon className="h-7 w-7" />
        </div>
        <p>
          The POC is single-tenant with sensible defaults. Multi-tenant
          configuration, project-level trade lists and roles wire in over the
          existing data model.
        </p>
      </div>
    </AppShell>
  );
}
