import { NextRequest, NextResponse } from "next/server";
import {
  listConsultTagOptions,
  searchRecipientProfessionals,
} from "@/lib/professionisti/consults";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const tagId = searchParams.get("tagId") ?? "";

    const [result, tags] = await Promise.all([
      searchRecipientProfessionals({ q, tagId }),
      listConsultTagOptions(),
    ]);

    return NextResponse.json({
      professionals: result.professionals,
      tagsByProfessional: result.tagsByProfessional,
      tags,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore ricerca destinatari" },
      { status: 400 }
    );
  }
}