import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server"; // <-- usa il tuo path reale
import { supabaseServer } from "@/lib/supabaseServer";

export async function getCurrentUserFromRequestOrThrow(req: Request) {
  // 1) Prova cookie-based (in futuro)
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      return { id: data.user.id, email: data.user.email ?? null };
    }
  } catch {
    // ignora e passa al bearer
  }

  // 2) Bearer token (ora funziona perché il client ha la session in localStorage)
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token) throw new Error("UNAUTHORIZED");

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) throw new Error("UNAUTHORIZED");

  return { id: data.user.id, email: data.user.email ?? null };
}