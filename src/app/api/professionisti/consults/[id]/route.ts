import { NextRequest, NextResponse } from "next/server";
import {
  getProfessionalConsultDetail,
  updateProfessionalConsult,
} from "@/lib/professionisti/consults";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const data = await getProfessionalConsultDetail(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore caricamento consulto" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const result = await updateProfessionalConsult({
      id,
      action: body.action,
      message: body.message,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore aggiornamento consulto" },
      { status: 400 }
    );
  }
}