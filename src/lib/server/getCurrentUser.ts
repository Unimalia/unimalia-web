import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export async function getCurrentUserOrThrow() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}