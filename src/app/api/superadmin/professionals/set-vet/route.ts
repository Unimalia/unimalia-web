import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const formData = await req.formData();
  const professionalId = String(formData.get("professionalId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "/superadmin/professionisti").trim();

  if (!professionalId) {
    return NextResponse.json({ error: "professionalId mancante" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { error } = await admin
    .from("professionals")
    .update({
      is_vet: true,
    })
    .eq("id", professionalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}