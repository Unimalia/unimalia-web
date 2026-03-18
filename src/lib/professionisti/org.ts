import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) return null;

  // 1) Fonte primaria: profilo professionale collegato all'utente
  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileOrgId = (profileResult.data as any)?.org_id ?? null;
  if (profileOrgId) return profileOrgId;

  // 2) Fallback: tabella professionals collegata all'utente
  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id, org_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  const professionalOrgId = (professionalResult.data as any)?.org_id ?? null;
  if (professionalOrgId) return professionalOrgId;

  // 3) Fallback operativo: usa l'id del professionista se presente
  const professionalId = (professionalResult.data as any)?.id ?? null;
  if (professionalId) return professionalId;

  return null;
}