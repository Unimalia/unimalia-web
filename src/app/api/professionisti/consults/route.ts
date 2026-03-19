import { NextRequest, NextResponse } from "next/server";
import { listProfessionalConsults, getComposeData, createProfessionalConsult } from "@/lib/professionisti/consults";

type ConsultBoxParam = "received" | "responses" | "waiting" | "archive";

function normalizeBoxParam(value: string | null): ConsultBoxParam {
  switch (value) {
    case "received":
      return "received";
    case "responses":
      return "responses";
    case "waiting":
      return "waiting";
    case "archive":
      return "archive";
    case "sent":
      return "waiting";
    default:
      return "received";
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");

    if (mode === "compose") {
      const animalId = searchParams.get("animalId");
      if (!animalId) {
        return NextResponse.json({ error: "animalId obbligatorio" }, { status: 400 });
      }

      const data = await getComposeData(animalId);
      return NextResponse.json(data);
    }

    const box = normalizeBoxParam(searchParams.get("box"));
    const status = searchParams.get("status") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const q = searchParams.get("q") ?? "";

    const items = await listProfessionalConsults({ box, status, priority, q });

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore caricamento consulti";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await createProfessionalConsult({
      animalId: String(body?.animalId || ""),
      receiverProfessionalId: String(body?.receiverProfessionalId || ""),
      subject: String(body?.subject || ""),
      message: String(body?.message || ""),
      shareMode:
        body?.shareMode === "selected_events" ? "selected_events" : "full_record",
      priority: body?.priority === "emergency" ? "emergency" : "normal",
      selectedEventIds: Array.isArray(body?.selectedEventIds)
        ? body.selectedEventIds.map((id: unknown) => String(id))
        : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore creazione consulto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}