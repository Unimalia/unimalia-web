// app/smarrimenti/[id]/opengraph-image/route.tsx
import React from "react";
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)."
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const supabase = supabaseServer();

  const { data } = await supabase
    .from("lost_events")
    .select(
      "id, species, animal_name, city, province, lost_date, primary_photo_url"
    )
    .eq("id", id)
    .single();

  const species = data?.species || "Animale";
  const name = data?.animal_name || "";
  const place = `${data?.city || "—"}${
    data?.province ? ` (${data.province})` : ""
  }`;
  const date = data?.lost_date
    ? new Date(data.lost_date).toLocaleDateString("it-IT")
    : "";

  const rawPhoto = data?.primary_photo_url || "";
  const photo =
    rawPhoto.startsWith("http://") || rawPhoto.startsWith("https://")
      ? rawPhoto
      : "";

  const title = `${species}${name ? ` – ${name}` : ""}`;
  const subtitle = `📍 ${place}${date ? ` • Smarrito il ${date}` : ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%, #f0fdfa 100%)",
          padding: 48,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 36,
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 32,
              borderRadius: 32,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(24,24,27,0.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  color: "#7c2d12",
                  fontSize: 22,
                  fontWeight: 700,
                  width: "fit-content",
                }}
              >
                🐾 ANIMALE SMARRITO
              </div>

              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: "#09090b",
                  lineHeight: 1.05,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: 28,
                  color: "#3f3f46",
                  lineHeight: 1.25,
                }}
              >
                {subtitle}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 22, color: "#52525b" }}>
                Condividi e aiuta a ritrovarlo.
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  padding: "10px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(15, 23, 42, 0.12)",
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                unimalia.it
              </div>
            </div>
          </div>

          <div
            style={{
              width: 420,
              borderRadius: 32,
              overflow: "hidden",
              position: "relative",
              border: "1px solid rgba(24,24,27,0.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 30,
                  color: "#71717a",
                  fontWeight: 700,
                  padding: 24,
                }}
              >
                Foto non disponibile
              </div>
            )}

            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 18,
                padding: "10px 14px",
                borderRadius: 18,
                background: "rgba(0,0,0,0.55)",
                color: "white",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              #{id.slice(0, 8)}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}