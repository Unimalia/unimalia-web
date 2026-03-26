import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const studyInstanceUid = req.nextUrl.searchParams.get("studyInstanceUid")?.trim();

    if (!studyInstanceUid) {
      return NextResponse.json(
        { error: "studyInstanceUid mancante" },
        { status: 400 }
      );
    }

    const orthancPublicUrl = (process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "")
      .trim()
      .replace(/\/+$/, "");

    if (!orthancPublicUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ORTHANC_PUBLIC_URL non configurato" },
        { status: 500 }
      );
    }

    const redirectUrl = `${orthancPublicUrl}/ohif/viewer?StudyInstanceUID=${encodeURIComponent(
      studyInstanceUid
    )}`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Errore apertura viewer",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}