import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProfessionalProfileOrgRow = {
  org_id: string | null;
};

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  const row = (data as ProfessionalProfileOrgRow | null) ?? null;
  return row?.org_id ?? null;
}