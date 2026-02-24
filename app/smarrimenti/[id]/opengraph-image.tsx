// app/smarrimenti/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function formatItDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return value;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // fallback values (se qualcosa va male)
  let title = "ANIMALE SMARRITO";
  let subtitle = "UNIMALIA • Annuncio smarrimento";
  let photoUrl: string | null = null;

  try {
    if (!supabaseUrl || !serviceKey) throw new Error("Missing supabase env for OG image");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("lost_events")
      .select("id, species, animal_name, city, province, lost_date, primary_photo_url, status, created_at")
      .eq("id", id)
      .single();

    if (!error && data) {
      const species = data.species || "Animale";
      const name = data.animal_name ? ` – ${data.animal_name}` : "";
      title = `${species}${name}`.toUpperCase();

      const where = `${data.city || ""}${data.province ? " (" + data.province + ")" : ""}`.trim();
      const when = data.lost_date ? `Smarrito il ${formatItDate(data.lost_date)}` : "Smarrimento";
      const status = data.status === "found" ? "CHIUSO" : "ATTIVO";

      subtitle = `${where} • ${when} • ${status}`;

      photoUrl = data.primary_photo_url || null;
    }
  } catch {
    // keep fallback
  }

  const bg1 = "rgba(245, 158, 11, 0.20)"; // amber-ish
  const bg2 = "rgba(20, 184, 166, 0.18)"; // teal-ish

  // Se non abbiamo foto, usiamo placeholder pubblico
  const safePhoto =
    photoUrl && photoUrl.startsWith("http")
      ? photoUrl
      : "https://www.unimalia.it/placeholder-animal.jpg";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
          background: "white",
          position: "relative",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        {/* soft blobs */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(20, 184, 166, 0.14))",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 9999,
            right: -120,
            top: -120,
            background: bg1,
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 9999,
            left: -140,
            bottom: -160,
            background: bg2,
            filter: "blur(40px)",
          }}
        />

        {/* left content */}
        <div
          style={{
            position: "relative",
            flex: 1,
            padding: 56,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 9999,
              border: "1px solid rgba(24,24,27,0.12)",
              background: "rgba(255,255,255,0.80)",
              width: "fit-content",
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            🐾 UNIMALIA
            <span style={{ color: "#b91c1c" }}>•</span> SMARRIMENTO
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.05,
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#334155",
              lineHeight: 1.25,
              maxWidth: 640,
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 18,
              color: "#475569",
            }}
          >
            Apri l’annuncio per foto, dettagli e contatti.
          </div>
        </div>

        {/* right photo */}
        <div
          style={{
            position: "relative",
            width: 440,
            padding: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 36,
              border: "1px solid rgba(24,24,27,0.12)",
              background: "rgba(255,255,255,0.65)",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <img
              src={safePhoto}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}