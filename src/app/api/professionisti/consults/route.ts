import { NextRequest, NextResponse } from "next/server";
import {
  createProfessionalConsult,
  getComposeData,
  listProfessionalConsults,
} from "@/lib/professionisti/consults";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (mode === "compose") {
      const animalId = searchParams.get("animalId");
      if (!animalId) {
        return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
      }

      const data = await getComposeData(animalId);
      return NextResponse.json(data);
    }

    const box = (searchParams.get("box") ?? "received") as "received" | "sent" | "archive";
    const status = searchParams.get("status") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const q = searchParams.get("q") ?? "";

    const items = await listProfessionalConsults({ box, status, priority, q });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore caricamento consulti" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await createProfessionalConsult({
      animalId: body.animalId,
      receiverProfessionalId: body.receiverProfessionalId,
      subject: body.subject,
      message: body.message,
      shareMode: body.shareMode,
      priority: body.priority,
      selectedEventIds: body.selectedEventIds ?? [],
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore creazione consulto" },
      { status: 400 }
    );
  }
}