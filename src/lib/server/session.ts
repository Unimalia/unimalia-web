import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserEmailOrThrow(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED: user session not found");
  }

  const email = user.email?.toLowerCase().trim();

  if (!email) {
    throw new Error("INVALID_SESSION: user email missing");
  }

  return email;
}