import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

type ProfessionalProfileRow = {
  user_id: string;
  organization_id: string | null;
};

export async function getProfessionalOrgId(userId: string): Promise<string | null> {
  const admin = supabaseAdmin();

  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return null;
  }

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, organization_id")
    .eq("user_id", normalizedUserId)
    .maybeSingle<ProfessionalProfileRow>();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileOrganizationId = profileResult.data?.organization_id ?? null;

  if (!profileOrganizationId) {
    return null;
  }

  const organizationResult = await admin
    .from("organizations")
    .select("id")
    .eq("id", profileOrganizationId)
    .maybeSingle<{ id: string }>();

  if (organizationResult.error) {
    throw organizationResult.error;
  }

  if (!organizationResult.data?.id) {
    return null;
  }

  return organizationResult.data.id;
}