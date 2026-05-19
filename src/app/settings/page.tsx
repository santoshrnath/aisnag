import { prisma } from "@/lib/prisma";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyProject } from "@/components/shell/EmptyProject";
import { SettingsClient } from "@/app/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const project = await getCurrentProject();
  if (!project) return <EmptyProject />;

  const trades = await prisma.trade.findMany({
    where: { projectId: project.id },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      projectClient={project.client}
    >
      <SettingsClient
        project={{
          id: project.id,
          name: project.name,
          client: project.client,
          developer: project.developer,
          contractor: project.contractor,
          location: project.location,
          status: project.status,
        }}
        trades={trades.map((t) => ({ id: t.id, name: t.name }))}
      />
    </AppShell>
  );
}
