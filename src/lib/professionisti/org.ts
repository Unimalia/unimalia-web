import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Se il tuo schema è diverso, qui è l’unico punto da cambiare.
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as any)?.org_id ?? null;
}