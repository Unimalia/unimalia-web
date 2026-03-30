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

  // Fonte primaria: professional_profiles.org_id
  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileOrgId = profileResult.data?.org_id ?? null;
  if (profileOrgId) return profileOrgId;

  // Fallback operativo: professionista collegato all'utente.
  // NON leggiamo org_id da professionals perché nel tuo schema potrebbe non esistere.
  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  const professionalId = professionalResult.data?.id ?? null;
  if (professionalId) return professionalId;

  return null;
}