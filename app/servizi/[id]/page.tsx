"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
  approved: boolean;
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

type Tag = {
  id: string;
  label: string;
};

type TagLink = {
  professional_id: string;
  tag_id: string;
};

function macroLabel(key: string) {
  switch (key) {
    case "veterinari":
      return "Veterinari";
    case "toelettatura":
      return "Toelettatura";
    case "pensione":
      return "Pensioni";
    case "pet_sitter":
      return "Pet sitter & Dog walking";
    case "addestramento":
      return "Addestramento";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "altro":
    default:
      return "Altro";
  }
}

export default function ServizioDettaglioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pro, setPro] = useState<Professional | null>(null);
  const [tagLabels, setTagLabels] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // contatto (richiesta)
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const isOwner = useMemo(() => {
    return !!(pro?.owner_id && currentUserId && pro.owner_id === currentUserId);
  }, [pro?.owner_id, currentUserId]);

  const backHref = useMemo(() => {
    // Se stai guardando la tua scheda (owner) torna al portale professionisti
    return isOwner ? "/professionisti" : "/servizi";
  }, [isOwner]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      // 1) carica scheda SENZA filtro approved
      const { data, error: proErr } = await supabase
        .from("professionals")
        .select(
          "id,owner_id,approved,display_name,category,city,province,address,phone,email,website,description"
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (proErr || !data) {
        setError("Scheda non trovata.");
        setPro(null);
        setTagLabels([]);
        setLoading(false);
        return;
      }

      const p = data as Professional;

      // 2) se NON approvata, la può vedere SOLO il proprietario
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      if (!p.approved && (!uid || uid !== p.owner_id)) {
        setError("Scheda non trovata o non disponibile.");
        setPro(null);
        setTagLabels([]);
        setLoading(false);
        return;
      }

      setPro(p);

      // 3) carica skill
      const { data: links } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", id);

      const linkRows = (links as TagLink[]) || [];
      const tagIds = linkRows.map((x) => x.tag_id);

      if (tagIds.length === 0) {
        setTagLabels([]);
        setLoading(false);
        return;
      }

      const { data: tags } = await supabase
        .from("professional_tags")
        .select("id,label")
        .in("id", tagIds);

      const t = (tags as Tag[]) || [];
      setTagLabels(t.map((x) => x.label).sort());

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  // anti-spam semplice (client-side)
  const COOLDOWN_SECONDS = 30;
  const cooldownKey = useMemo(() => `unimalia:pro_contact:${id}`, [id]);

  function getLastSentAt() {
    try {
      const raw = localStorage.getItem(cooldownKey);
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  function setLastSentAt(ts: number) {
    try {
      localStorage.setItem(cooldownKey, String(ts));
    } catch {}
  }

  async function sendRequest() {
    setInfo(null);
    setError(null);

    if (!pro) return;

    // se owner, non serve inviare richiesta a se stessi
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      router.push("/login");
      return;
    }
    if (pro.owner_id && user.id === pro.owner_id) {
      setInfo("Questa è la tua scheda: non puoi inviare richieste a te stesso.");
      return;
    }

    const last = getLastSentAt();
    const until = last + COOLDOWN_SECONDS * 1000;
    const now = Date.now();
    if (now < until) {
      const sec = Math.ceil((until - now) / 1000);
      setInfo(`Attendi ${sec}s prima di inviare un altro messaggio.`);
      return;
    }

    const text = msg.trim();
    if (text.length < 5) {
      setInfo("Scrivi un messaggio un po’ più completo (minimo 5 caratteri).");
      return;
    }

    setSending(true);
    try {
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const { error } = await supabase.from("professional_contact_requests").insert({
        professional_id: pro.id,
        sender_id: user.id,
        message: text,
      });

      if (error) throw error;

      setLastSentAt(Date.now());
      setMsg("");
      setInfo("Messaggio inviato ✅");
    } catch {
      setInfo("Errore nell’invio. Riprova.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Caricamento…</p>
        </div>
      </main>
    );
  }

  if (error || !pro) {
    return (
      <main>
        <button
          type="button"
          onClick={() => router.push("/servizi")}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Indietro
        </button>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">{error ?? "Scheda non disponibile."}</p>
          <Link href="/servizi" className="mt-3 inline-block text-sm font-medium hover:underline">
            Torna ai Servizi
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* TOP BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Indietro
        </button>

        <Link href="/servizi" className="text-sm font-medium text-zinc-600 hover:underline">
          Servizi
        </Link>
      </div>

      {/* HEADER */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pro.display_name}</h1>
            <p className="mt-2 text-zinc-700">
              {macroLabel(pro.category)} • {pro.city} {pro.province ? `(${pro.province})` : ""}
            </p>
          </div>

          {/* Badge approvazione */}
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold",
              pro.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
            ].join(" ")}
            title={
              pro.approved
                ? "Scheda visibile pubblicamente"
                : "Scheda visibile solo a te finché non viene approvata"
            }
          >
            {pro.approved ? "Pubblica" : "In revisione"}
          </span>
        </div>

        {tagLabels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tagLabels.map((l) => (
              <span
                key={l}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Descrizione</h2>
            {pro.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{pro.description}</p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Scheda in aggiornamento.</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Contatta</h2>

            {isOwner ? (
              <p className="mt-3 text-sm text-zinc-700">
                Sei il proprietario della scheda. Le richieste contatto arriveranno nel tuo portale.
              </p>
            ) : (
              <>
                <p className="mt-3 text-sm text-zinc-700">
                  Invia una richiesta. Il professionista la riceverà nel suo portale.
                </p>

                <label className="mt-4 block text-sm font-medium">Messaggio</label>
                <textarea
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  rows={5}
                  placeholder="Es. Vorrei info su… disponibilità… prezzi…"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                />

                <button
                  type="button"
                  onClick={sendRequest}
                  disabled={sending}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {sending ? "Invio..." : "Invia richiesta"}
                </button>

                {info && <p className="mt-3 text-sm text-zinc-700">{info}</p>}

                <p className="mt-4 text-xs text-zinc-500">
                  Anti-spam: limitazione invio messaggi per evitare abusi.
                </p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Indirizzo</h2>
            <p className="mt-3 text-sm text-zinc-700">{pro.address ?? "Non disponibile"}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Contatti</h2>

            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              <div>
                <span className="font-medium">Telefono:</span>{" "}
                {pro.phone ? pro.phone : "Non disponibile"}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                {pro.email ? pro.email : "Non disponibile"}
              </div>
              <div>
                <span className="font-medium">Sito:</span>{" "}
                {pro.website ? (
                  <a
                    href={pro.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-900 underline underline-offset-2"
                  >
                    Apri sito
                  </a>
                ) : (
                  "Non disponibile"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
