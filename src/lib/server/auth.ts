import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server"; // <-- se nel tuo progetto è diverso, vedi nota sotto

export type CurrentUser = { id: string; email: string | null };

export async function getCurrentUserFromBearerOrThrow(req: Request): Promise<CurrentUser> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token) throw new Error("UNAUTHORIZED");

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) throw new Error("UNAUTHORIZED");

  return { id: data.user.id, email: data.user.email ?? null };
}