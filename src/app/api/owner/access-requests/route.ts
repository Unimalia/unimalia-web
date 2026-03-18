import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

type Action = "approve" | "reject" | "block" | "revoke";
type Duration = "24h" | "7d" | "6m" | "forever";

function isValidAction(value: string): value is Action {
  return value === "approve" || value === "reject" || value === "block" || value === "revoke";
}

function isValidDuration(value: string): value is Duration {
  return value === "24h" || value === "7d" || value === "6m" || value === "forever";
}

function computeValidTo(duration: Duration) {
  const now = new Date();

  if (duration === "forever") return null;
  if (duration === "24h") now.setHours(now.getHours() + 24);
  if (duration === "7d") now.setDate(now.getDate() + 7);
  if (duration === "6m") now.setMonth(now.getMonth() + 6);

  return now.toISOString();
}

async function tryResolveOrgNames(admin: ReturnType<typeof supabaseAdmin>, orgIds: string[]) {
  const orgNameById = new Map<string, string>();

  if (!orgIds.length) return orgNameById;

  // Primo tentativo: tabella organizations
  try {
    const { data, error } = await admin
      .from("organizations")
      .select("id, name, display_name, ragione_sociale")
      .in("id", orgIds);

    if (!error) {
      for (const row of data ?? []) {
        orgNameById.set(
          row.id,
          (row as any).name ??
            (row as any).display_name ??
            (row as any).ragione_sociale ??
            row.id
        );
      }

      if (orgNameById.size > 0) return orgNameById;
    }
  } catch {
    // fallback sotto
  }

  // Fallback: tabella professionals
  try {
    const { data, error } = await admin
      .from("professionals")
      .select("id, display_name, business_name, first_name, last_name")
      .in("id", orgIds);

    if (!error) {
      for (const row of data ?? []) {
        const name =
          (row as any).display_name ??
          (row as any).business_name ??
          [((row as any).first_name ?? "").trim(), ((row as any).last_name ?? "").trim()]
            .filter(Boolean)
            .join(" ") ??
          row.id;

        orgNameById.set(row.id, name || row.id);
      }
    }
  } catch {
    // se fallisce anche questo, mostreremo direttamente org_id
  }

  return orgNameById;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = url.searchParams.get("animalId");

    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    let q = admin
      .from("animal_access_requests")
      .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (animalId) q = q.eq("animal_id", animalId);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];

    const animalIds = Array.from(new Set(rows.map((r: any) => r.animal_id).filter(Boolean)));
    const orgIds = Array.from(new Set(rows.map((r: any) => r.org_id).filter(Boolean)));

    const animalNameById = new Map<string, string>();

    if (animalIds.length) {
      const { data: animals, error: animalsErr } = await admin
        .from("animals")
        .select("id, name")
        .in("id", animalIds);

      if (animalsErr) {
        return NextResponse.json({ error: animalsErr.message }, { status: 500 });
      }

      for (const a of animals ?? []) {
        animalNameById.set(a.id, a.name ?? a.id);
      }
    }

    const orgNameById = await tryResolveOrgNames(admin, orgIds);

    const enriched = rows.map((r: any) => ({
      ...r,
      expires_at: null,
      animal_name: animalNameById.get(r.animal_id) ?? r.animal_id,
      org_name: orgNameById.get(r.org_id) ?? r.org_id,
    }));

    return NextResponse.json({ rows: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore caricamento richieste owner" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.id || !body?.action) {
      return NextResponse.json({ error: "Missing id/action" }, { status: 400 });
    }

    const id = String(body.id);
    const actionRaw = String(body.action);
    if (!isValidAction(actionRaw)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const action: Action = actionRaw;
    const durationRaw = body.duration ? String(body.duration) : "7d";
    const duration: Duration = isValidDuration(durationRaw) ? durationRaw : "7d";

    const { data: reqRow, error: reqErr } = await admin
      .from("animal_access_requests")
      .select("id, animal_id, owner_id, org_id, status, requested_scope")
      .eq("id", id)
      .maybeSingle();

    if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
    if (!reqRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (reqRow.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "approve") {
      const validTo = computeValidTo(duration);

      const requestedScopeRaw = Array.isArray(reqRow.requested_scope) ? reqRow.requested_scope : [];
      const requestedScope = requestedScopeRaw.filter(
        (item) => item === "read" || item === "write"
      );

      const { data: existingGrant, error: existingGrantErr } = await admin
        .from("animal_access_grants")
        .select("id")
        .eq("animal_id", reqRow.animal_id)
        .eq("grantee_type", "org")
        .eq("grantee_id", reqRow.org_id)
        .is("revoked_at", null)
        .maybeSingle();

      if (existingGrantErr) {
        return NextResponse.json({ error: existingGrantErr.message }, { status: 500 });
      }

      if (existingGrant?.id) {
        const { error: updGrantErr } = await admin
          .from("animal_access_grants")
          .update({
            granted_by_user_id: user.id,
            scope_read: requestedScope.includes("read"),
            scope_write: requestedScope.includes("write"),
            scope_upload: false,
            purpose: "owner_approved_request",
            valid_from: new Date().toISOString(),
            valid_to: validTo,
            status: "active",
            revoked_at: null,
            revoked_by_user_id: null,
          })
          .eq("id", existingGrant.id);

        if (updGrantErr) {
          return NextResponse.json({ error: updGrantErr.message }, { status: 500 });
        }
      } else {
        const { error: grantErr } = await admin.from("animal_access_grants").insert({
          animal_id: reqRow.animal_id,
          granted_by_user_id: user.id,
          grantee_type: "org",
          grantee_id: reqRow.org_id,
          scope_read: requestedScope.includes("read"),
          scope_write: requestedScope.includes("write"),
          scope_upload: false,
          purpose: "owner_approved_request",
          valid_from: new Date().toISOString(),
          valid_to: validTo,
          status: "active",
        });

        if (grantErr) {
          return NextResponse.json({ error: grantErr.message }, { status: 500 });
        }
      }

      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "approved",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      return NextResponse.json({
        ok: true,
        status: "approved",
        expires_at: validTo,
      });
    }

    if (action === "reject") {
      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "rejected",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, status: "rejected" });
    }

    if (action === "block") {
      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "blocked",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, status: "blocked" });
    }

    if (action === "revoke") {
      const { error: revErr } = await admin
        .from("animal_access_grants")
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by_user_id: user.id,
          status: "revoked",
        })
        .eq("animal_id", reqRow.animal_id)
        .eq("grantee_type", "org")
        .eq("grantee_id", reqRow.org_id)
        .is("revoked_at", null);

      if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 });

      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "revoked",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, status: "revoked" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore gestione richiesta owner" },
      { status: 500 }
    );
  }
}