import { getUserMemberships } from "@/lib/server/memberships";
import { getActiveOrgIdFromCookie } from "@/lib/active-org";
import ActiveOrgSelectorClient from "./ActiveOrgSelectorClient";

export default async function ActiveOrgSelector() {
  const memberships = (await getUserMemberships()).filter((m) => m.status === "active");

  if (memberships.length <= 1) return null;

  const cookieOrgId = await getActiveOrgIdFromCookie();
  const defaultOrg =
    memberships.find((m) => m.organizationId === cookieOrgId) ??
    memberships.find((m) => m.isDefault) ??
    memberships[0];

  return (
    <ActiveOrgSelectorClient
      memberships={memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organizationName,
      }))}
      activeOrgId={defaultOrg.organizationId}
    />
  );
}