import { AppShell } from "@/components/shell/AppShell";
import { ClipboardCheck } from "lucide-react";

export default function InspectionsPage() {
  return (
    <AppShell>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Inspections</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Templates and guided walks.
        </p>
      </div>
      <div className="mx-auto max-w-md px-6 py-12 text-center text-sm text-slate-500">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <ClipboardCheck className="h-7 w-7" />
        </div>
        <p>
          Inspections (checklist templates + handover-walk mode) ship in the
          next iteration. The data model and storage are already in place — the
          UI is on the road map for v2.
        </p>
      </div>
    </AppShell>
  );
}
