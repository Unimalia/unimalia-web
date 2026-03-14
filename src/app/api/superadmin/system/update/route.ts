import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

function toBoolean(value: FormDataEntryValue | null) {
  return String(value || "").toLowerCase() === "true";
}

function sanitizeRedirectTo(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/superadmin")) return "/superadmin/sistema";
  if (raw.startsWith("//")) return "/superadmin/sistema";
  return raw;
}

export async function POST(req: Request) {
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const formData = await req.formData();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  const payload = {
    emergency_mode: toBoolean(formData.get("emergency_mode")),
    maintenance_mode: toBoolean(formData.get("maintenance_mode")),
    public_registration_enabled: toBoolean(formData.get("public_registration_enabled")),
    professional_registration_enabled: toBoolean(formData.get("professional_registration_enabled")),
    lost_found_enabled: toBoolean(formData.get("lost_found_enabled")),
    public_search_enabled: toBoolean(formData.get("public_search_enabled")),
    consults_enabled: toBoolean(formData.get("consults_enabled")),
    owner_access_requests_enabled: toBoolean(formData.get("owner_access_requests_enabled")),
  };

  const admin = supabaseAdmin();

  const { error } = await admin
    .from("system_settings")
    .update({
      value_json: payload,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("key", "core");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    adminId: user.id,
    action: "system_settings_updated",
    targetType: "system_settings",
    targetId: "core",
    meta: {
      redirectTo,
      payload,
    },
  });

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}