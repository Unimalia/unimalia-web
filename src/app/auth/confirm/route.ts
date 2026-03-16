import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function normalizePhone(input: string) {
  const raw = (input || "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function sanitizeNextPath(value: string | null) {
  if (!value) return "/identita";
  if (!value.startsWith("/")) return "/identita";
  if (value.startsWith("//")) return "/identita";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=link-non-valido", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=conferma-non-valida", requestUrl.origin)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const meta = (user.user_metadata ?? {}) as Record<string, any>;

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: (meta.full_name ?? "").trim() || null,
        phone: normalizePhone(meta.phone ?? "") || null,
        city: (meta.city ?? "").trim() || null,
        fiscal_code: normalizeCF(meta.fiscal_code ?? "") || null,
        phone_verified: false,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.redirect(
    new URL(
      `/login?mode=signup&onboarding=phone&next=${encodeURIComponent(next)}`,
      requestUrl.origin
    )
  );
}