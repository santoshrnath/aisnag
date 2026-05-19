// Resolve which project the user is currently viewing.
//
// We store the choice as a plain cookie (`snagpin.currentProjectId`) so
// the URL stays stable across navigation and the dashboard / drawings /
// snags / tasks / reports pages all agree on what "current project" means.
//
// Resolution order:
//   1. cookie value, if it points at an existing project for this tenant
//   2. the first project (by createdAt) for this tenant
//   3. null — caller should render an empty-state CTA to create one
//
// The cookie is set client-side by the ProjectSwitcher dropdown via
// `document.cookie`; no HTTP-only requirement since the value is just a
// public project id and the API still scopes by tenant on every read.

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant";

export const CURRENT_PROJECT_COOKIE = "snagpin.currentProjectId";

export async function getCurrentProject() {
  const tenantId = currentTenant();
  const cookieId = cookies().get(CURRENT_PROJECT_COOKIE)?.value;

  if (cookieId) {
    const found = await prisma.project.findFirst({
      where: { id: cookieId, tenantId },
    });
    if (found) return found;
  }

  return prisma.project.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
}
