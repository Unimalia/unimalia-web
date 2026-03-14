import "server-only";

import { createClient } from "@/lib/supabase/server";
import { OrgMembership, OrgMemberRole, OrgMemberStatus } from "@/lib/org-membership";
import { getCurrentUserEmailOrThrow } from "@/lib/server/session";

type MembershipRow = {
  organization_id: string;
  role: string | null;
  status: string | null;
  is_default: boolean | null;
  organizations: { id: string; name: string }[] | null;
};

function toOrgMemberRole(role: string | null): OrgMemberRole {
  const normalized = (role ?? "").toLowerCase().trim();

  if (normalized === "org_owner") return "org_owner";
  if (normalized === "vet") return "vet";
  if (normalized === "assistant") return "assistant";
  if (normalized === "front_desk") return "front_desk";

  // fallback sicuro
  return "assistant";
}

function toOrgMemberStatus(status: string | null): OrgMemberStatus {
  const normalized = (status ?? "").toLowerCase().trim();

  if (normalized === "active") return "active";
  if (normalized === "invited") return "invited";
  if (normalized === "suspended") return "suspended";

  return "suspended";
}

export async function getUserMemberships(): Promise<OrgMembership[]> {
  await getCurrentUserEmailOrThrow();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      status,
      is_default,
      organizations (
        id,
        name
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("MEMBERSHIP_QUERY_FAILED");
  }

  const rows = (data ?? []) as MembershipRow[];

  return rows.map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations?.[0]?.name ?? "",
    memberRole: toOrgMemberRole(row.role),
    status: toOrgMemberStatus(row.status),
    isDefault: row.is_default ?? false,
  }));
}
