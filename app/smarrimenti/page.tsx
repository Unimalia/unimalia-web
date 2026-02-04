"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type LostEvent = {
  id: string;
  created_at: string;
  reporter_id: string;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  lost_date: string;
  primary_photo_url: string;
  lat: number | null;
  lng: number | null;
  contact_phone: string | null;
  contact_email: string | null;
};

const COOLDOWN_SECONDS = 30;

function getCooldownKey(eventId: string) {
  return `unimalia:last_contact_sent:${eventId}`;
}

function getLastSentAt(eventId: string) {
  try {
    const raw = localStorage.getItem(getCooldownKey(eventId));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setLastSentAt(eventId: string, ts: number) {
  try {
    localStorage.setItem(getCooldownKey(eventId), String(ts));
  } catch {}
}

export default function SmarrimentiPage() {
  const router = useRouter();

  const [items, setItems] = useState<LostEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // base url per share (es: http://localhost:3000)
  const [baseUrl, setBaseUrl] = useState("");

  // modal contatto
  const [selected, setSelected] = useState<LostEvent | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);

  // cooldown (anti spam)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  useEffect(() => {
    // base url solo client-side (safe)
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("lost_events")
        .select(
          "id, created_at, reporter_id, species, animal_name, description, city, province, lost_date, primary_photo_url, lat, lng, contact_phone, contact_email"
        )
        .eq("status", "active")
        .order("lost_date", { ascending: false });

      if (!error && data) setItems(data);
      setLoading(false);
    }
    load();
  }, []);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      const p = (i.province || "").trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const c = cityFilter.trim().toLowerCase();
    const p = provinceFilter.trim().toLowerCase();
    return items.filter((i) => {
      const cityOk = !c || (i.city ?? "").toLowerCase().includes(c);
      const provOk = !p || (i.province ?? "").toLowerCase() === p;
      return cityOk && provOk;
    });
  }, [items, cityFilter, provinceFilter]);

  function resetFilters() {
    setCityFilter("");
    setProvinceFilter("");
  }

  function mapsUrl(item: LostEvent) {
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }
    const q = `${item.city || ""} ${item.province || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  function detailUrl(item: LostEvent) {
    return `/smarrimenti/${item.id}`;
  }

  async function copyShareLink(item: LostEvent) {
    if (!baseUrl) return;
    const link = `${baseUrl}${detailUrl(item)}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiato ✅");
    } catch {
      alert("Non riesco a copiare il link. Copialo manualmente dalla barra.");
    }
  }

  function whatsappShareLink(item: LostEvent) {
    if (!baseUrl) return "https://wa.me/";
    const link = `${baseUrl}${detailUrl(item)}`;
    const text = `Guarda questo smarrimento su UNIMALIA: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function openContactModal(item: LostEvent) {
    setModalMsg(null);
    setMessage("");

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    // anti-spam: recupera ultimo invio per questo annuncio
    const last = getLastSentAt(item.id);
    const until = last + COOLDOWN_SECONDS * 1000;
    setCooldownUntil(until);

    setCurrentUserId(user.id);
    setSelected(item);
  }

  async function sendContactRequest() {
    if (!selected) return;
    setModalMsg(null);

    const now = Date.now();
    if (now < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - now) / 1000);
      setModalMsg(`Attendi ${sec}s prima di inviare un altro messaggio per questo annuncio.`);
      return;
    }

    const text = message.trim();
    if (text.length < 5) {
      setModalMsg("Scrivi un messaggio un po’ più completo (minimo 5 caratteri).");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      router.push("/login");
      return;
    }

    // non permettere invio al proprio annuncio (anche se già bloccato da policy)
    if (selected.reporter_id === user.id) {
      setModalMsg("Questo è un tuo annuncio: non puoi inviarti un messaggio da solo.");
      return;
    }

    setSending(true);
    try {
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const { error } = await supabase.from("contact_requests").insert({
        event_id: selected.id,
        sender_id: user.id,
        message: text,
      });

      if (error) throw error;

      // imposta cooldown lato UI
      const ts = Date.now();
      setLastSentAt(selected.id, ts);
      setCooldownUntil(ts + COOLDOWN_SECONDS * 1000);

      setModalMsg("Messaggio inviato ✅");
      setMessage("");
    } catch (e: any) {
      setModalMsg(e?.message ?? "Errore nell’invio del messaggio");
    } finally {
      setSending(false);
    }
  }

  function closeModal() {
    setSelected(null);
    setModalMsg(null);
    setMessage("");
    setCooldownUntil(0);
  }

  async function markFound(item: LostEvent) {
    if (!currentUserId || item.reporter_id !== currentUserId) return;

    const ok = window.confirm("Confermi che l’animale è stato ritrovato?");
    if (!ok) return;

    const { error } = await supabase
      .from("lost_events")
      .update({ status: "found" })
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  if (loading) return <p>Caricamento smarrimenti…</p>;

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Animali smarriti</h1>
      <p className="mt-3 text-zinc-700">Segnalazioni attive di animali smarriti.</p>

      {/* FILTRI */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-900">Città</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Firenze"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900">Provincia</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
            >
              <option value="">Tutte</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Risultati: <span className="font-medium text-zinc-700">{filtered.length}</span>
        </p>
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-zinc-700">Nessuno smarrimento corrisponde ai filtri selezionati.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((item) => {
            const imgSrc =
              (item.primary_photo_url || "/placeholder-animal.jpg") +
              `?v=${encodeURIComponent(item.created_at)}`;

            const isOwner = currentUserId && item.reporter_id === currentUserId;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <img
                  src={imgSrc}
                  alt={item.animal_name || item.species}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                  }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {item.species}
                      {item.animal_name ? ` – ${item.animal_name}` : ""}
                    </h2>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => markFound(item)}
                        className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        title="Chiudi annuncio"
                      >
                        Ritrovato ✅
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {(item.city || "—")} {item.province ? `(${item.province})` : ""} –{" "}
                    {new Date(item.lost_date).toLocaleDateString()}
                  </p>

                  <p className="mt-3 text-sm text-zinc-700">{item.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={detailUrl(item)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </a>

                    <a
                      href={mapsUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Google Maps
                    </a>

                    <button
                      type="button"
                      onClick={() => openContactModal(item)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Contatta il proprietario
                    </button>

                    <button
                      type="button"
                      onClick={() => copyShareLink(item)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      disabled={!baseUrl}
                      title={!baseUrl ? "Caricamento…" : "Copia link"}
                    >
                      Copia link
                    </button>

                    <a
                      href={whatsappShareLink(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CONTATTO */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Contatta il proprietario</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {selected.species}
                  {selected.animal_name ? ` – ${selected.animal_name}` : ""} •{" "}
                  {(selected.city || "—")}
                  {selected.province ? ` (${selected.province})` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p className="font-medium text-zinc-900">Contatti</p>
              <div className="mt-2 space-y-1 text-zinc-700">
                <div>
                  <span className="font-medium">Telefono:</span>{" "}
                  {selected.contact_phone ? selected.contact_phone : "Non disponibile"}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {selected.contact_email ? selected.contact_email : "Non disponibile"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium">Invia un messaggio</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={4}
                placeholder="Es. L’ho visto in zona… Ho informazioni utili…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                type="button"
                disabled={sending}
                onClick={sendContactRequest}
                className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {sending ? "Invio..." : "Invia messaggio"}
              </button>

              {modalMsg && <p className="mt-3 text-sm text-zinc-700">{modalMsg}</p>}

              {Date.now() < cooldownUntil && (
                <p className="mt-2 text-xs text-zinc-500">
                  Anti-spam: puoi inviare un altro messaggio tra{" "}
                  <span className="font-medium">
                    {Math.ceil((cooldownUntil - Date.now()) / 1000)}s
                  </span>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
