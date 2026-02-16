"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

type OwnerProfile = {
  full_name?: string | null;
  name?: string | null; // fallback se già esiste nel tuo schema
  fiscal_code?: string | null;
};

type Animal = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  chip_number: string | null;
  microchip_verified: boolean;
  status: string;
  premium_active: boolean;
  premium_expires_at: string | null;
  unimalia_code: string;

  // join owner
  profiles?: OwnerProfile | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string;
  is_vet: boolean;
};

type AnimalEvent = {
  id: string;
  animal_id: string;
  professional_user_id: string;
  event_type: string;
  event_date: string; // yyyy-mm-dd
  title: string;
  notes: string | null;
  created_at: string;
};

type EventFile = {
  id: string;
  event_id: string;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

function statusLabel(status: string) {
  switch (status) {
    case "lost":
      return "🔴 Smarrito";
    case "found":
      return "🔵 Ritrovato";
    case "home":
    case "safe":
    default:
      return "🟢 A casa";
  }
}

function normalizeChip(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function formatBytes(n?: number | null) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProAnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ruolo professionista
  const [pro, setPro] = useState<ProfessionalRow | null>(null);

  // QR + BARCODE
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  // eventi
  const [events, setEvents] = useState<AnimalEvent[]>([]);
  const [files, setFiles] = useState<Record<string, EventFile[]>>({});
  const [eventsLoading, setEventsLoading] = useState(false);

  // form evento
  const [eventType, setEventType] = useState("visita");
  const [eventDate, setEventDate] = useState(todayISO());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [docFiles, setDocFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  // signed urls cache
  const [signed, setSigned] = useState<Record<string, string>>({});

  const isVet = !!pro?.is_vet;

  const ownerName = useMemo(() => {
    const p = animal?.profiles;
    const n = (p?.full_name || p?.name || "").trim();
    return n || "Nome non disponibile";
  }, [animal]);

  const ownerCF = useMemo(() => {
    const cf = (animal?.profiles?.fiscal_code || "").trim();
    return cf || null;
  }, [animal]);

  // carica animale + ruolo pro
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // ruolo professionista (serve per bottone verifica microchip)
      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select("id,owner_id,is_vet")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (proErr) {
        // non blocco: la pagina può comunque funzionare, ma senza bottone vet
        setPro(null);
      } else {
        setPro((proData as ProfessionalRow) || null);
      }

      // carica animale + owner profile (nome/cf)
      const { data, error } = await supabase
        .from("animals")
        .select(
          `
          id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,premium_active,premium_expires_at,unimalia_code,
          profiles:owner_id ( full_name, name, fiscal_code )
        `
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError(error?.message || "Profilo non trovato o non disponibile.");
        setAnimal(null);
        setLoading(false);
        return;
      }

      setAnimal(data as Animal);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  // payload codice digitale
  const digitalCode = useMemo(() => {
    if (!animal) return null;

    // Se c'è microchip => definitivo = microchip
    if (animal.chip_number && normalizeChip(animal.chip_number)) {
      return {
        kind: "microchip" as const,
        label: "Microchip",
        value: normalizeChip(animal.chip_number),
      };
    }

    // altrimenti => UNIMALIA ID
    return {
      kind: "unimalia" as const,
      label: "UNIMALIA ID",
      value: `UNIMALIA:${animal.unimalia_code}`,
    };
  }, [animal]);

  // genera QR/Barcode
  useEffect(() => {
    async function buildCodes() {
      setQrDataUrl(null);
      if (!digitalCode?.value) return;

      const payload = digitalCode.value;

      try {
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 8,
        });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl(null);
      }

      try {
        if (barcodeSvgRef.current) {
          JsBarcode(barcodeSvgRef.current, payload, {
            format: "CODE128",
            displayValue: true,
            lineColor: "#111827",
            width: 2,
            height: 60,
            margin: 10,
            fontSize: 14,
          });
        }
      } catch {}
    }

    buildCodes();
  }, [digitalCode]);

  const premiumOk = useMemo(() => {
    if (!animal) return false;
    if (!animal.premium_active) return false;
    if (!animal.premium_expires_at) return true;
    return new Date(animal.premium_expires_at).getTime() > Date.now();
  }, [animal]);

  function typeLabel(t: string) {
    switch (t) {
      case "vaccino":
        return "Vaccino";
      case "esame":
        return "Esame";
      case "terapia":
        return "Terapia";
      case "dieta":
        return "Dieta";
      case "visita":
        return "Visita";
      default:
        return "Altro";
    }
  }

  async function loadEvents() {
    if (!animal?.id) return;

    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("animal_events")
        .select("id,animal_id,professional_user_id,event_type,event_date,title,notes,created_at")
        .eq("animal_id", animal.id)
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const evs = (data as AnimalEvent[]) || [];
      setEvents(evs);

      if (evs.length === 0) {
        setFiles({});
        return;
      }

      const ids = evs.map((e) => e.id);

      const { data: fData, error: fErr } = await supabase
        .from("animal_event_files")
        .select("id,event_id,storage_path,filename,mime_type,size,created_at")
        .in("event_id", ids)
        .order("created_at", { ascending: false });

      if (fErr) throw fErr;

      const by: Record<string, EventFile[]> = {};
      for (const f of (fData as EventFile[]) || []) {
        if (!by[f.event_id]) by[f.event_id] = [];
        by[f.event_id].push(f);
      }
      setFiles(by);
    } catch {
      setFormMsg("Errore nel caricamento degli eventi. Riprova.");
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    if (animal?.id) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal?.id]);

  async function openFile(file: EventFile) {
    if (signed[file.id]) {
      window.open(signed[file.id], "_blank", "noreferrer");
      return;
    }

    const { data, error } = await supabase.storage
      .from("animal-docs")
      .createSignedUrl(file.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      alert("Non riesco ad aprire il documento. Riprova.");
      return;
    }

    setSigned((prev) => ({ ...prev, [file.id]: data.signedUrl }));
    window.open(data.signedUrl, "_blank", "noreferrer");
  }

  async function saveEvent() {
    setFormMsg(null);
    if (!animal?.id) return;

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      setFormMsg("Inserisci un titolo (almeno 3 caratteri).");
      return;
    }
    if (!eventDate) {
      setFormMsg("Seleziona una data valida.");
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("animal_events")
        .insert({
          animal_id: animal.id,
          professional_user_id: user.id,
          event_type: eventType,
          event_date: eventDate,
          title: cleanTitle,
          notes: notes.trim() ? notes.trim() : null,
        })
        .select("id")
        .single();

      if (insErr || !inserted?.id) throw insErr || new Error("Insert failed");
      const eventId = inserted.id as string;

      const list = docFiles ? Array.from(docFiles) : [];
      for (const f of list) {
        const safeName = f.name.replace(/[^\w.\-() ]+/g, "_");
        const path = `${animal.id}/${eventId}/${Date.now()}_${safeName}`;

        const { error: upErr } = await supabase.storage.from("animal-docs").upload(path, f, {
          contentType: f.type || "application/octet-stream",
          upsert: false,
        });

        if (upErr) throw new Error("Caricamento documento non riuscito. Riprova.");

        const { error: rowErr } = await supabase.from("animal_event_files").insert({
          event_id: eventId,
          storage_path: path,
          filename: f.name,
          mime_type: f.type || null,
          size: f.size || null,
        });

        if (rowErr) throw new Error("Errore nel salvataggio del documento. Riprova.");
      }

      setTitle("");
      setNotes("");
      setDocFiles(null);
      const input = document.getElementById("docInput") as HTMLInputElement | null;
      if (input) input.value = "";

      setFormMsg("Evento salvato ✅");
      await loadEvents();
    } catch (e: any) {
      setFormMsg(e?.message || "Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !animal) {
    return (
      <main className="max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
          <Link href="/professionisti" className="text-sm text-zinc-600 hover:underline">
            ← Portale
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Errore."}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>

          <p className="mt-2 text-zinc-700">
            {animal.species}
            {animal.breed ? ` • ${animal.breed}` : ""}
            {" • "}
            {statusLabel(animal.status)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")} • Proprietario:{" "}
            <span className="font-medium">{ownerName}</span>
            {" • "}
            Codice fiscale:{" "}
            <span className={`font-medium ${ownerCF ? "" : "text-amber-700"}`}>
              {ownerCF ? ownerCF : "Non inserito (obbligatorio)"}
            </span>
          </p>

          {!ownerCF && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Il codice fiscale del proprietario è obbligatorio per completare l’identità digitale. (Da inserire lato proprietario.)
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/professionisti")}
            className="text-sm text-zinc-600 hover:underline"
          >
            ← Portale
          </button>

          <Link
            href="/professionisti/scansiona"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Apri scanner
          </Link>
        </div>
      </div>

      {/* PROFILO + STATO */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Identità</h2>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Nome</dt>
              <dd className="font-medium">{animal.name}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Tipo</dt>
              <dd className="font-medium">{animal.species}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Razza</dt>
              <dd className="font-medium">{animal.breed || "—"}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Colore / segni</dt>
              <dd className="font-medium">{animal.color || "—"}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Taglia</dt>
              <dd className="font-medium">{animal.size || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Stato profilo</h2>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              Profilo completo:{" "}
              <span className="font-medium">{premiumOk ? "attivo ✅" : "limitato"}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Ambiente professionisti: inserisci eventi e documenti in modo rapido.
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Microchip</h3>

              {/* ✅ 1 click: SOLO veterinari */}
              {isVet && (
                <Link
                  href={`/professionisti/animali/${animal.id}/verifica`}
                  className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  title="Verifica o correggi il microchip"
                >
                  Verifica microchip ✅
                </Link>
              )}
            </div>

            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-700">
                {animal.chip_number ? "Microchip presente ✔️" : "Microchip assente"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {animal.chip_number
                  ? animal.microchip_verified
                    ? "Verificato ✅"
                    : "Inserito (non verificato)."
                  : "Animale identificato tramite UNIMALIA ID."}
              </p>
            </div>

            {!isVet && (
              <p className="mt-2 text-xs text-zinc-500">
                La verifica microchip è disponibile solo per veterinari autorizzati.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* CODICI */}
      <div className="mt-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Codice digitale</h2>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-800">
              Tipo: <span className="font-semibold">{digitalCode?.label}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {digitalCode?.label === "Microchip"
                ? "Questo è il codice definitivo dell’animale."
                : "Questo codice è valido per animali senza microchip."}
            </p>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold">Barcode (CODE128)</p>
              <div className="mt-3 overflow-x-auto">
                <svg ref={barcodeSvgRef} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">Contenuto: {digitalCode?.label}</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold">QR code</p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR codice digitale"
                  className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-white object-contain"
                />
              ) : (
                <div className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-zinc-50" />
              )}
              <p className="mt-2 text-xs text-zinc-500">Contenuto: {digitalCode?.label}</p>
            </div>
          </div>
        </section>
      </div>

      {/* EVENTI: aggiungi veloce + lista */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* FORM */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Aggiungi evento veloce</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Inserisci visita/vaccino/esame in pochi secondi e allega referti.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Tipo</label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="visita">Visita</option>
                <option value="vaccino">Vaccino</option>
                <option value="esame">Esame</option>
                <option value="terapia">Terapia</option>
                <option value="dieta">Dieta</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Data</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Titolo</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                placeholder="Es. Vaccino rabbia / Visita controllo / Esame sangue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Note (opzionale)</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={4}
                placeholder="Es. dose, richiami, valori principali, indicazioni…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Allega documenti (opzionale)</label>
              <input
                id="docInput"
                type="file"
                multiple
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                onChange={(e) => setDocFiles(e.target.files)}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Referti, fatture, PDF, immagini. Visibili solo dentro UNIMALIA (bucket privato).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={saveEvent}
            disabled={saving}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvo..." : "Salva evento"}
          </button>

          {formMsg && <p className="mt-3 text-sm text-zinc-700">{formMsg}</p>}
        </section>

        {/* LISTA */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Timeline</h2>
            <button
              type="button"
              onClick={loadEvents}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Aggiorna
            </button>
          </div>

          {eventsLoading ? (
            <p className="mt-4 text-sm text-zinc-700">Caricamento eventi…</p>
          ) : events.length === 0 ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Nessun evento registrato.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {events.map((e) => (
                <div key={e.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {typeLabel(e.event_type)} •{" "}
                        {new Date(e.event_date).toLocaleDateString("it-IT")}
                      </p>
                      <p className="mt-1 text-sm text-zinc-700">{e.title}</p>
                      {e.notes && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{e.notes}</p>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {new Date(e.created_at).toLocaleString("it-IT")}
                    </p>
                  </div>

                  {files[e.id]?.length ? (
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-xs font-semibold text-zinc-700">Documenti</p>
                      <div className="mt-2 space-y-2">
                        {files[e.id].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => openFile(f)}
                            className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm hover:bg-zinc-50"
                            title="Apri documento"
                          >
                            <span className="truncate">
                              {f.filename}{" "}
                              <span className="ml-2 text-xs text-zinc-500">{formatBytes(f.size)}</span>
                            </span>
                            <span className="text-xs font-semibold text-zinc-700">Apri</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Link temporanei (signed URL) per sicurezza.
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
