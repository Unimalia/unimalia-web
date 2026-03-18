import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) return null;

  // 1) Fonte primaria: professional_profiles.org_id
  const profileResult = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileOrgId = (profileResult.data as any)?.org_id ?? null;
  if (profileOrgId) return profileOrgId;

  // 2) Fallback: tabella professionals collegata all'utente
  // Proviamo prima con org_id, se il tuo schema lo prevede.
  const professionalWithOrgResult = await supabase
    .from("professionals")
    .select("id, owner_id, org_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!professionalWithOrgResult.error) {
    const professionalOrgId = (professionalWithOrgResult.data as any)?.org_id ?? null;
    if (professionalOrgId) return professionalOrgId;
  }

  // 3) Fallback finale: se non esiste org_id ma esiste un professionista,
  // in alcuni setup mono-struttura l'id del professionista coincide di fatto
  // con l'entità usata come "grantee/org" nei grant.
  // Questo fallback serve per non bloccare il flusso operativo.
  const professionalResult = await supabase
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  const professionalId = (professionalResult.data as any)?.id ?? null;
  if (professionalId) return professionalId;

  return null;
}