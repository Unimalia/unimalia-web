// src/lib/professionisti/org.ts
import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // TODO_RENAME: se la tua tabella non è professional_profiles
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as any)?.org_id ?? null;
}