// Auth context + tenant resolution + super-admin check.
//
// - Anonymous visitor: reads from the "default" demo pool. AI / vector
//   write endpoints return 401.
// - Authenticated Clerk user: their `tenantId == userId`. They see their
//   own snags + the demo pool (read-only for the demo).
// - Super admin (env list): sees every tenant. Writes still go to the
//   admin's own tenant.

import { auth, currentUser } from "@clerk/nextjs/server";

export const DEFAULT_TENANT = "default";

export interface AuthContext {
  userId: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  tenantId: string;
  canSeeAllTenants: boolean;
}

function adminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        userId: null,
        email: null,
        isSuperAdmin: false,
        tenantId: DEFAULT_TENANT,
        canSeeAllTenants: false,
      };
    }
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
    const isSuperAdmin =
      !!email && adminEmails().includes(email.toLowerCase());
    return {
      userId,
      email,
      isSuperAdmin,
      tenantId: userId,
      canSeeAllTenants: isSuperAdmin,
    };
  } catch {
    // Clerk not configured in this env — fall back to the demo tenant.
    return {
      userId: null,
      email: null,
      isSuperAdmin: false,
      tenantId: DEFAULT_TENANT,
      canSeeAllTenants: false,
    };
  }
}
