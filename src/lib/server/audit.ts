import { SupabaseClient } from "@supabase/supabase-js";
import { getRequestMeta } from "./requestMeta";

type AuditInput = {
  req: Request;
  actor_user_id: string | null;
  actor_org_id?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  animal_id?: string | null;
  result: "success" | "denied" | "error";
  reason?: string | null;
  diff?: unknown | null;
};

export async function writeAudit(supabase: SupabaseClient, input: AuditInput) {
  try {
    const { ip, ua } = getRequestMeta(input.req);

    await supabase.from("audit_logs").insert({
      occurred_at: new Date().toISOString(),
      actor_user_id: input.actor_user_id,
      actor_org_id: input.actor_org_id ?? null,
      action: input.action,
      target_type: input.target_type,
      target_id: input.target_id,
      animal_id: input.animal_id ?? null,
      result: input.result,
      reason: input.reason ?? null,
      ip,
      user_agent: ua,
      diff: input.diff ?? null,
    });
  } catch {
    // mai bloccare la UX per audit
  }
}