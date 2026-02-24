import { createClient } from "@supabase/supabase-js";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function AnnuncioPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabasePublic
    .from("reports_public") // VIEW SAFE (consigliato)
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return <div style={{ padding: 24 }}>Annuncio non disponibile.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{data.title}</h1>
      <p style={{ color: "#555" }}>
        {data.region} • {data.province} • {data.location_text}
      </p>

      <div style={{ marginTop: 16 }}>
        <b>Tipo:</b> {data.type}
      </div>

      {data.description && <p style={{ marginTop: 12 }}>{data.description}</p>}

      {data.public_phone && (
        <p style={{ marginTop: 12 }}>
          <b>Telefono:</b> {data.public_phone}
        </p>
      )}

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Invia un messaggio (contatto protetto)</h2>
      <form action="/api/reports/message" method="post">
        {/* Questo è solo demo: in reale userai fetch */}
        <input type="hidden" name="report_id" value={data.id} />
        <p style={{ marginTop: 8 }}>
          (Qui poi mettiamo il form React con fetch)
        </p>
      </form>
    </div>
  );
}