import "server-only";
import { getBearerToken } from "@/lib/server/bearer";
import { supabaseAdmin } from "@/lib/supabase/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function getCurrentUserFromRequestOrThrow(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      return { id: data.user.id, email: data.user.email ?? null };
    }
  } catch {
    // ignora e passa al bearer
  }

  const token = getBearerToken(req);

  if (!token) throw new Error("UNAUTHORIZED");

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) throw new Error("UNAUTHORIZED");

  return { id: data.user.id, email: data.user.email ?? null };
}