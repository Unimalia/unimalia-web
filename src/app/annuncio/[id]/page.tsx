import { createClient } from "@supabase/supabase-js";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AnnuncioPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await supabasePublic
    .from("reports_public")
    .select("*")
    .eq("id", id)
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

      {Array.isArray(data.photo_urls) && data.photo_urls.length > 0 ? (
        <div style={{ marginTop: 20 }}>
          <img
            src={data.photo_urls[0]}
            alt={data.animal_name || data.species || data.title}
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
            }}
          />
        </div>
      ) : null}

      {data.description ? <p style={{ marginTop: 12 }}>{data.description}</p> : null}

      {data.public_phone ? (
        <p style={{ marginTop: 12 }}>
          <b>Telefono:</b> {data.public_phone}
        </p>
      ) : null}

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Invia un messaggio (contatto protetto)</h2>
      <form action="/api/reports/message" method="post">
        <input type="hidden" name="report_id" value={data.id} />
        <p style={{ marginTop: 8 }}>(Qui poi mettiamo il form React con fetch)</p>
      </form>
    </div>
  );
}