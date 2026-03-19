import { NextResponse } from "next/server";
import {
  listProfessionalConsults,
  type ConsultBox,
} from "@/lib/professionisti/consults";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

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