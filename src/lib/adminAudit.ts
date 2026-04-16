import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AuditPayload = {
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
};

export async function writeAdminAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  meta,
}: AuditPayload) {
  try {
    const hdrs = await headers();

    const forwardedFor = hdrs.get("x-forwarded-for") || "";
    const realIp = hdrs.get("x-real-ip") || "";
    const userAgent = hdrs.get("user-agent") || "";

    const admin = supabaseAdmin();

    const { error } = await admin.from("admin_audit_log").insert({
      admin_id: adminId || null,
      action,
      target_type: targetType,
      target_id: targetId || null,
      meta_json: {
        ...(meta || {}),
        ip: realIp || forwardedFor || null,
        user_agent: userAgent || null,
      },
    });

    if (error) {
      console.error("admin_audit_log insert error:", error.message);
    }
  } catch (err) {
    console.error("admin_audit_log unexpected error:", err);
  }
}