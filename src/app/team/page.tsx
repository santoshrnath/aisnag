import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const tenantId = currentTenant();
  const project = await getCurrentProject();
  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell
      projectId={project?.id ?? null}
      projectName={project?.name ?? "—"}
      projectClient={project?.client ?? null}
    >
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Team</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {users.length} {users.length === 1 ? "member" : "members"}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
              {initials(u.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-900">{u.name}</div>
              <div className="truncate text-xs text-slate-500">{u.email}</div>
              <div className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                {u.role.toLowerCase()}
              </div>
            </div>
          </li>
        ))}
        {users.length === 0 && (
          <li className="col-span-full text-center text-sm text-slate-400">
            No team members yet.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
