// src/app/api/reports/create/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin(); // ✅

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ip_hash = hashIp(ip);

    const body = await req.json().catch(() => ({}));

    // ⚠️ lascia i tuoi campi così come li avevi (qui metto i più comuni)
    const title = String(body?.title || "").trim();
    const contact_email = String(body?.contact_email || "").trim();
    const type = body?.type ?? null;
    const payload = body?.payload ?? null;

    if (!title || !contact_email) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    // Rate limit: max N report / 24h per ip_hash (tieni la tua soglia se era diversa)
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { count, error: countErr } = await admin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ip_hash)
      .gte("created_at", since);

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 400 });
    }

    const limit = Number(body?.rate_limit ?? 10); // se nel tuo file era fisso, puoi rimetterlo fisso
    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: "Limite creazione annunci raggiunto. Riprova più tardi." },
        { status: 429 }
      );
    }

    // crea record
    const insertRow: any = {
      title,
      contact_email,
      type,
      payload,
      ip_hash,
    };

    // Se nel tuo schema hai verify_token ecc, qui NON lo invento:
    // se già lo generavi nel tuo file, rimetti la tua logica.
    // Esempio (se lo usavi):
    if (body?.verify_token) insertRow.verify_token = body.verify_token;
    if (typeof body?.email_verified === "boolean") insertRow.email_verified = body.email_verified;

    const { data, error } = await admin.from("reports").insert(insertRow).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, report: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore server" }, { status: 500 });
  }
}