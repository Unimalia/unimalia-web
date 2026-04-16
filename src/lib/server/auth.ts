import "server-only";
import { getBearerToken } from "@/lib/server/bearer";
import { supabaseAdmin } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

export async function getCurrentUserFromBearerOrThrow(req: Request): Promise<CurrentUser> {
  const token = getBearerToken(req);

  if (!token) throw new Error("UNAUTHORIZED");

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) throw new Error("UNAUTHORIZED");

  return { id: data.user.id, email: data.user.email ?? null };
}
