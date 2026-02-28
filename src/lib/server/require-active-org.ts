import "server-only";
import { getActiveOrgIdFromCookie } from "@/lib/active-org";
import { getUserMemberships } from "@/lib/server/memberships";

export async function requireActiveOrgIdOrThrow(): Promise<string> {
  const orgId = await getActiveOrgIdFromCookie();
  if (!orgId) throw new Error("ACTIVE_ORG_REQUIRED");

  const memberships = await getUserMemberships();
  const ok = memberships.some((m) => m.organizationId === orgId && m.status === "active");
  if (!ok) throw new Error("ACTIVE_ORG_FORBIDDEN");

  return orgId;
}