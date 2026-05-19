// Tenant resolution.
//
// For the POC, every call defaults to the "default" demo pool — keeping
// the surface sync and simple. The Clerk-aware version lives in
// `lib/auth-context.ts` (getAuthContext) for routes that want per-user
// isolation; it's an additive layer, not a replacement.

export const DEFAULT_TENANT = "default";

export function currentTenant(): string {
  return DEFAULT_TENANT;
}
