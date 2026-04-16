import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const CLOSED_OTHER_STATUS = "closed_other";

type CloseOtherBody = {
  token?: string;
};

type ReportRow = {
  id: string;
  status: string | null;
  type: string | null;
  animal_id: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CloseOtherBody;
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Token mancante." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("id, status, type, animal_id")
      .eq("claim_token", token)
      .single<ReportRow>();

    if (error || !report) {
      return NextResponse.json({ error: "Annuncio non valido." }, { status: 404 });
    }

    if (report.type !== "lost") {
      return NextResponse.json(
        { error: "Questa azione Ã¨ disponibile solo per gli smarrimenti." },
        { status: 400 }
      );
    }

    if (report.status === CLOSED_OTHER_STATUS) {
      return NextResponse.json({ ok: true, already: true, status: report.status });
    }

    if (report.status !== "active") {
      return NextResponse.json(
        { error: "Questo annuncio non Ã¨ piÃ¹ in uno stato aggiornabile da questa pagina." },
        { status: 400 }
      );
    }

    const { error: updateError } = await admin
      .from("reports")
      .update({ status: CLOSED_OTHER_STATUS })
      .eq("id", report.id)
      .eq("status", "active");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (report.animal_id) {
      await admin
        .from("animals")
        .update({ status: "home" })
        .eq("id", report.animal_id);
    }

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      status: CLOSED_OTHER_STATUS,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore server" },
      { status: 500 }
    );
  }
}
