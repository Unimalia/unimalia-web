"use client";

import { useState } from "react";

type ReportType = "lost" | "found" | "sighted";
type ContactMode = "protected" | "phone_public";

export default function NuovoSmarrimentoPage() {
  const [type, setType] = useState<ReportType>("lost");
  const [title, setTitle] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [species, setSpecies] = useState("cane");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMode, setContactMode] = useState<ContactMode>("protected");
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!consent) {
      setResultMsg("Devi accettare il consenso per pubblicare l’annuncio.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim() || (type === "lost" ? "Smarrimento" : type === "found" ? "Trovato in custodia" : "Avvistamento"),
          animal_name: animalName.trim() || null,
          species: species.trim(),
          region: region.trim(),
          province: province.trim(),
          location_text: locationText.trim(),
          event_date: eventDate,
          description: description.trim() || null,
          photo_urls: [], // per ora, poi aggiungiamo upload
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          contact_mode: contactMode,
          consent
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResultMsg(data?.error || "Errore pubblicazione.");
        return;
      }

      setResultMsg("✅ Perfetto! Controlla la tua email per confermare l’annuncio.");
    } catch (err: any) {
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Pubblica (rapido)</h1>
      <p style={{ color: "#555" }}>
        Pubblica in 60 secondi e condividi subito su Facebook. Ti inviamo una mail per confermare.
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <label>
          Tipo annuncio
          <select value={type} onChange={(e) => setType(e.target.value as ReportType)} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}>
            <option value="lost">Smarrito</option>
            <option value="found">Trovato (in custodia)</option>
            <option value="sighted">Avvistato</option>
          </select>
        </label>

        <label>
          Titolo (breve)
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Cane smarrito - Leo - Firenze" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Nome animale (opzionale)
          <input value={animalName} onChange={(e) => setAnimalName(e.target.value)} placeholder="Leo" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Specie
          <select value={species} onChange={(e) => setSpecies(e.target.value)} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}>
            <option value="cane">Cane</option>
            <option value="gatto">Gatto</option>
            <option value="altro">Altro</option>
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Regione
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Toscana" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
          </label>
          <label>
            Provincia
            <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="FI" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
          </label>
        </div>

        <label>
          Zona / Comune / Quartiere
          <input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Es. Coverciano, Firenze" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Data evento
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Descrizione (opzionale)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Segni particolari, collare, zona precisa..." style={{ display: "block", width: "100%", padding: 10, marginTop: 6, minHeight: 90 }} />
        </label>

        <label>
          Email (obbligatoria)
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="tu@email.it" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Telefono (opzionale)
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+39..." style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Modalità contatto
          <select value={contactMode} onChange={(e) => setContactMode(e.target.value as ContactMode)} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}>
            <option value="protected">Contatto protetto (consigliato)</option>
            <option value="phone_public">Mostra telefono pubblicamente</option>
          </select>
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Accetto informativa privacy e autorizzo la pubblicazione dell’annuncio secondo le opzioni selezionate.</span>
        </label>

        <button disabled={loading} style={{ padding: 12, borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 700 }}>
          {loading ? "Pubblicazione..." : "Pubblica annuncio"}
        </button>

        {resultMsg && <div style={{ padding: 12, borderRadius: 12, background: "#f6f6f6" }}>{resultMsg}</div>}
      </form>
    </div>
  );
}