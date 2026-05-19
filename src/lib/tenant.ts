// Tenant resolution. The POC is single-tenant — every row carries
// `tenantId = "default"` so multi-tenant can be enabled later by simply
// reading the tenant id from the auth context here.

export const DEFAULT_TENANT = "default";

export function currentTenant(): string {
  return DEFAULT_TENANT;
}
