import { NextResponse } from "next/server";
import {
  createProfessionalConsult,
  getComposeData,
  listProfessionalConsults,
  type ConsultBox,
} from "@/lib/professionisti/consults";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode");

    if (mode === "compose") {
      const animalId = searchParams.get("animalId") ?? "";

      if (!animalId) {
        return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
      }

      const compose = await getComposeData(animalId);

      return NextResponse.json(compose);
    }

    const rawBox = searchParams.get("box");
    const box: ConsultBox =
      rawBox === "sent" || rawBox === "archive" ? rawBox : "received";

    const status = searchParams.get("status") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const q = searchParams.get("q") ?? "";

    const items = await listProfessionalConsults({ box, status, priority, q });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createProfessionalConsult({
      animalId: String(body?.animalId ?? ""),
      receiverProfessionalId: String(body?.receiverProfessionalId ?? ""),
      subject: String(body?.subject ?? ""),
      message: String(body?.message ?? ""),
      shareMode:
        body?.shareMode === "selected_events" ? "selected_events" : "full_record",
      priority: body?.priority === "emergency" ? "emergency" : "normal",
      selectedEventIds: Array.isArray(body?.selectedEventIds)
        ? body.selectedEventIds.map((id: unknown) => String(id))
        : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore creazione consulto" },
      { status: 400 }
    );
  }
}
