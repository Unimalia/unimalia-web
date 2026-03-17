"use client";

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

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/annuncio/${data.id}`;

  function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{data.title}</h1>
      <p style={{ color: "#555" }}>
        {data.region} • {data.province} • {data.location_text}
      </p>

      <button
        onClick={shareFacebook}
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#1877F2",
          color: "white",
          borderRadius: 8,
        }}
      >
        Condividi su Facebook
      </button>

      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const form = e.target as any;
          const message = form.message.value;
          const sender_email = form.sender_email.value;

          const res = await fetch("/api/reports/contact", {
            method: "POST",
            body: JSON.stringify({
              report_id: data.id,
              message,
              sender_email,
            }),
          });

          if (res.ok) {
            alert("Messaggio inviato ✅");
            form.reset();
          } else {
            alert("Errore invio");
          }
        }}
        style={{ marginTop: 20 }}
      >
        <h3>Contatta chi ha pubblicato</h3>

        <input
          type="email"
          name="sender_email"
          placeholder="La tua email"
          required
          style={{ display: "block", marginTop: 10 }}
        />

        <textarea
          name="message"
          placeholder="Scrivi un messaggio..."
          required
          style={{ display: "block", marginTop: 10 }}
        />

        <button type="submit" style={{ marginTop: 10 }}>
          Invia messaggio
        </button>
      </form>

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
        <p style={{ marginTop: 8 }}>(Qui poi mettiamo il form React con fetch)</p>
      </form>
    </div>
  );
}