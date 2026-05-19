import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";
import { getCurrentProject } from "@/lib/current-project";
import { AppShell } from "@/components/shell/AppShell";
import { ProjectsGrid } from "@/components/shell/ProjectsGrid";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const tenantId = currentTenant();
  const current = await getCurrentProject();
  const projects = await prisma.project.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { snags: true, drawings: true } } },
  });

  return (
    <AppShell
      projectId={current?.id ?? null}
      projectName={current?.name ?? "—"}
      projectClient={current?.client ?? null}
    >
      <ProjectsGrid
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          client: p.client,
          developer: p.developer,
          contractor: p.contractor,
          location: p.location,
          coverColor: p.coverColor,
          createdAt: p.createdAt.toISOString(),
          snagCount: p._count.snags,
          drawingCount: p._count.drawings,
        }))}
        currentId={current?.id ?? null}
      />
    </AppShell>
  );
}
