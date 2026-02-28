import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentUserFromRequestOrThrow } from "@/lib/server/getCurrentUserFromRequest";
import { requireActiveOrgIdOrThrow } from "@/lib/server/require-active-org";

export const dynamic = "force-dynamic";

// TODO: quando hai le tabelle vere, questa diventa query reale su organization_members + professional_profiles
async function assertCanVerifyAsVet(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string,
  actingOrgId: string
) {
  // 1) membership attiva in quella clinica
  const { data: membership, error: mErr } = await admin
    .from("organization_members")
    .select("member_role,status")
    .eq("user_id", userId)
    .eq("organization_id", actingOrgId)
    .maybeSingle();

  if (mErr) throw new Error(mErr.message);
  if (!membership || membership.status !== "active") throw new Error("FORBIDDEN");

  // 2) ruolo vet (o owner) — qui puoi decidere
  const roleOk = membership.member_role === "vet" || membership.member_role === "org_owner";
  if (!roleOk) throw new Error("FORBIDDEN");

  // 3) (facoltativo ma consigliato) profilo professionista vet verificato
  const { data: prof, error: pErr } = await admin
    .from("professional_profiles")
    .select("category,verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (pErr) throw new Error(pErr.message);
  // se vuoi obbligatorio:
  if (!prof || prof.category !== "vet" || prof.verification_status !== "verified") {
    throw new Error("VET_NOT_VERIFIED");
  }
}

export async function POST(req: Request) {
  try {
    // ✅ 1) utente loggato (da cookie supabase) — via helper request-based
    const user = await getCurrentUserFromRequestOrThrow(req);

    // ✅ 2) clinica attiva (da cookie unimalia_active_org)
    const actingOrgId = await requireActiveOrgIdOrThrow();

    const body = await req.json().catch(() => null);
    const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds : [];
    const verifiedByLabel = String(body?.verifiedByLabel || "Veterinario").trim();

    const cleanIds = eventIds.map((x) => String(x).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const now = new Date().toISOString();

    // ✅ 3) permessi veri (membership + vet verificato)
    await assertCanVerifyAsVet(admin, user.id, actingOrgId);

    // ✅ 4) update eventi (aggiungi colonne se non esistono)
    const payload: Record<string, any> = {
      verified_at: now,
      verified_by_label: verifiedByLabel,
      // Consigliato (aggiungi colonne):
      verified_by_user_id: user.id,
      verified_org_id: actingOrgId,
    };

    const { error } = await admin
      .from("animal_clinic_events")
      .update(payload)
      .in("id", cleanIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message || "server_error";
    const status =
      msg === "UNAUTHORIZED"
        ? 401
        : msg === "ACTIVE_ORG_REQUIRED" || msg === "ACTIVE_ORG_FORBIDDEN"
          ? 403
          : msg === "FORBIDDEN"
            ? 403
            : msg === "VET_NOT_VERIFIED"
              ? 403
              : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}