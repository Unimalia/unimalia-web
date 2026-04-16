import { NextRequest, NextResponse } from "next/server";
import {
  searchRecipientProfessionals,
} from "@/lib/professionisti/consults";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const tagId = searchParams.get("tagId") ?? "";

    const result = await searchRecipientProfessionals({ q, tagId });

    const uniqueTagsMap = new Map<string, { id: string; label: string; key: string }>();

    for (const professionalId of Object.keys(result.tagsByProfessional)) {
      for (const tag of result.tagsByProfessional[professionalId] ?? []) {
        uniqueTagsMap.set(tag.id, tag);
      }
    }

    const tags = Array.from(uniqueTagsMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "it")
    );

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
