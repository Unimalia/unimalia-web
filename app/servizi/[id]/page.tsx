"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  display_name: string;
  category: string;
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

const COOLDOWN_SECONDS = 30;

function getCooldownKey(proId: string) {
  return `unimalia:last_pro_contact_sent:${proId}`;
}
function getLastSentAt(proId: string) {
  try {
    const raw = localStorage.getItem(getCooldownKey(proId));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function setLastSentAt(proId: string, ts: number) {
  try {
    localStorage.setItem(getCooldownKey(proId), String(ts));
  } catch {}
}

export default function ServizioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Professional | null>(null);
  const [error, setError] = useState<string | null>(null);

  // modal contatto
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("professionals")
        .select("id,display_name,category,city,province,address,phone,email,website,description")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError("Scheda non trovata o non disponibile.");
        setItem(null);
      } else {
        setItem(data as Professional);
      }

      setLoading(false);
    }

    if (id) load();
    return () => {
      alive = false;
    };
  }, [id]);

  function openModal() {
    setModalMsg(null);
    setMessage("");
    const last = getLastSentAt(id);
    const until = last + COOLDOWN_SECONDS * 1000;
    setCooldownUntil(until);
    setOpen(true);
  }

  async function send() {
    if (!item) return;

    setModalMsg(null);

    const now = Date.now();
    if (now < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - now) / 1000);
      setModalMsg(`Attendi ${sec}s prima di inviare un altro messaggio.`);
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

    setSending(true);
    try {
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const { error } = await supabase.from("professional_contact_requests").insert({
        professional_id: item.id,
        sender_id: user.id,
        message: text,
      });

      if (error) throw error;

      const ts = Date.now();
      setLastSentAt(item.id, ts);
      setCooldownUntil(ts + COOLDOWN_SECONDS * 1000);

      setModalMsg("Messaggio inviato ✅");
      setMessage("");
    } catch (e: any) {
      setModalMsg(e?.message ? "Errore nell’invio. Riprova." : "Errore nell’invio.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">{error ?? "Scheda non disponibile."}</p>
          <Link href="/servizi" className="mt-4 inline-block text-sm font-medium hover:underline">
            ← Torna ai servizi
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{item.display_name}</h1>
          <p className="mt-2 text-zinc-700">
            {item.category} • {item.city}
            {item.province ? ` (${item.province})` : ""}
          </p>
        </div>

        <Link href="/servizi" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Servizi
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Descrizione</h2>
          <p className="mt-3 text-sm text-zinc-700">
            {item.description ? item.description : "Scheda in aggiornamento."}
          </p>

          {item.address && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900">Indirizzo</h3>
              <p className="mt-2 text-sm text-zinc-700">{item.address}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Contatti</h2>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div>
              <span className="font-medium">Telefono:</span>{" "}
              {item.phone ? item.phone : "Non disponibile"}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {item.email ? item.email : "Non disponibile"}
            </div>
            <div>
              <span className="font-medium">Sito:</span>{" "}
              {item.website ? (
                <a className="underline" href={item.website} target="_blank" rel="noreferrer">
                  Apri
                </a>
              ) : (
                "Non disponibile"
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="mt-6 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Richiedi contatto
          </button>

          <p className="mt-3 text-xs text-zinc-500">
            Anti-spam: limitazione invio messaggi per evitare abusi.
          </p>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Contatta {item.display_name}</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Scrivi un messaggio: il professionista lo vedrà nella sua area dedicata (in arrivo).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium">Messaggio</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={4}
                placeholder="Es. Vorrei informazioni su… disponibilità… prezzi…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                type="button"
                disabled={sending}
                onClick={send}
                className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {sending ? "Invio..." : "Invia messaggio"}
              </button>

              {modalMsg && <p className="mt-3 text-sm text-zinc-700">{modalMsg}</p>}

              {Date.now() < cooldownUntil && (
                <p className="mt-2 text-xs text-zinc-500">
                  Puoi inviare un altro messaggio tra{" "}
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
