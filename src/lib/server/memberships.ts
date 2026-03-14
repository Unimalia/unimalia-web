import "server-only";

import { createClient } from "@/lib/supabase/server";
import { OrgMembership } from "@/lib/org-membership";
import { getCurrentUserEmailOrThrow } from "@/lib/server/session";

export async function getUserMemberships(): Promise<OrgMembership[]> {
  const email = await getCurrentUserEmailOrThrow();

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("UNAUTHORIZED");
  }

  const userId = userData.user.id;

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
    .eq("user_id", userId);

  if (error) {
    throw new Error("MEMBERSHIP_QUERY_FAILED");
  }

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "",
    memberRole: row.role,
    status: row.status,
    isDefault: row.is_default ?? false,
  }));
}