import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/server/audit";

export async function safeWriteAudit(
  supabase: SupabaseClient<any, "public", any>,
  payload: Parameters<typeof writeAudit>[1]
) {
  try {
    await writeAudit(supabase as any, payload);
  } catch (error) {
    console.error("[AUDIT_WRITE_ERROR]", error);
  }
}