import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export async function hasActiveGrantForAnimal(animalId: string) {
  const supabase = await createServerSupabaseClient();
  const orgId = await getProfessionalOrgId();
  if (!orgId) return false;

  const { data, error } = await supabase.rpc("is_grant_active", {
    p_animal: animalId,
    p_org: orgId,
  });

  if (error) throw error;
  return Boolean(data);
}