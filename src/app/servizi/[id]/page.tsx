"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  verification_status: string;
  verification_level: string;
  public_visible: boolean;
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
    case "pet_detective":
      return "Pet Detective";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "altro":
    default:
      return "Altro";
  }
}

function badgeInfo(pro: Professional) {
  if (pro.verification_level === "regulated_vet") {
    if (pro.verification_status === "verified" && pro.public_visible) {
      return {
        label: "Struttura veterinaria verificata",
        className:
          "border border-emerald-200 bg-emerald-50/90 text-emerald-700",
        title: "Scheda veterinaria verificata e visibile pubblicamente",
      };
    }

    if (pro.verification_status === "rejected") {
      return {
        label: "Verifica rifiutata",
        className: "border border-red-200 bg-red-50/90 text-red-700",
        title: "La verifica della scheda è stata rifiutata",
      };
    }

    return {
      label: "Struttura veterinaria in verifica",
      className: "border border-amber-200 bg-amber-50/90 text-amber-700",
      title: "Scheda in verifica, non ancora pubblica",
    };
  }

  if (pro.verification_level === "business") {
    if (pro.verification_status === "verified" && pro.public_visible) {
      return {
        label: "Attività verificata",
        className:
          "border border-emerald-200 bg-emerald-50/90 text-emerald-700",
        title: "Scheda business verificata e visibile pubblicamente",
      };
    }

    if (pro.verification_status === "rejected") {
      return {
        label: "Verifica rifiutata",
        className: "border border-red-200 bg-red-50/90 text-red-700",
        title: "La verifica della scheda è stata rifiutata",
      };
    }

    return {
      label: "Attività in verifica",
      className: "border border-amber-200 bg-amber-50/90 text-amber-700",
      title: "Scheda in verifica, non ancora pubblica",
    };
  }

  if (pro.verification_status === "verified" && pro.public_visible) {
    return {
      label: "Profilo base verificato",
      className:
        "border border-emerald-200 bg-emerald-50/90 text-emerald-700",
      title: "Profilo base verificato e visibile pubblicamente",
    };
  }

  if (pro.verification_status === "rejected") {
    return {
      label: "Verifica rifiutata",
      className: "border border-red-200 bg-red-50/90 text-red-700",
      title: "La verifica della scheda è stata rifiutata",
    };
  }

  return {
    label: "Profilo base in verifica",
    className: "border border-amber-200 bg-amber-50/90 text-amber-700",
    title: "Scheda in verifica, non ancora pubblica",
  };
}

export default function ServizioDettaglioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = params?.id;

  const from = (searchParams?.get("from") || "").toLowerCase();
  const preferBackToProfessionisti = from === "professionisti";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pro, setPro] = useState<Professional | null>(null);
  const [tagLabels, setTagLabels] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    if (preferBackToProfessionisti) return "/professionisti";
    return "/servizi";
  }, [preferBackToProfessionisti]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data, error: proErr } = await supabase
        .from("professionals")
        .select(
          "id,owner_id,approved,display_name,category,city,province,address,phone,email,website,description,verification_status,verification_level,public_visible"
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

      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const isPublicProfile = p.public_visible && p.verification_status === "verified";

      if (!isPublicProfile && (!uid || uid !== p.owner_id)) {
        setError("Scheda non trovata o non disponibile.");
        setPro(null);
        setTagLabels([]);
        setLoading(false);
        return;
      }

      setPro(p);

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
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="overflow-hidden rounded-[28px] border border-[#e3e9f0] bg-white/92 p-6 shadow-[0_20px_60px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8">
            <div className="h-3 w-32 rounded-full bg-[#dfe7f0]" />
            <div className="mt-6 h-10 w-2/3 rounded-2xl bg-[#eef3f8]" />
            <div className="mt-4 h-4 w-1/2 rounded-full bg-[#eef3f8]" />
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-6 shadow-sm">
                  <div className="h-5 w-32 rounded-full bg-[#eef3f8]" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-full rounded-full bg-[#f1f5f9]" />
                    <div className="h-4 w-11/12 rounded-full bg-[#f1f5f9]" />
                    <div className="h-4 w-4/5 rounded-full bg-[#f1f5f9]" />
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-6 shadow-sm">
                  <div className="h-5 w-28 rounded-full bg-[#eef3f8]" />
                  <div className="mt-4 h-28 rounded-2xl bg-[#f6f9fc]" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-6 shadow-sm">
                  <div className="h-5 w-24 rounded-full bg-[#eef3f8]" />
                  <div className="mt-4 h-4 w-3/4 rounded-full bg-[#f1f5f9]" />
                </div>
                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-6 shadow-sm">
                  <div className="h-5 w-24 rounded-full bg-[#eef3f8]" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-full rounded-full bg-[#f1f5f9]" />
                    <div className="h-4 w-5/6 rounded-full bg-[#f1f5f9]" />
                    <div className="h-4 w-2/3 rounded-full bg-[#f1f5f9]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !pro) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="overflow-hidden rounded-[28px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_20px_60px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8e1eb] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:border-[#c9d5e2] hover:bg-[#f8fbff]"
            >
              ← Indietro
            </button>

            <div className="mt-6 rounded-[24px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm sm:p-8">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Servizi UNIMALIA
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f] sm:text-3xl">
                Scheda non disponibile
              </h1>

              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                {error ?? "Scheda non disponibile."}
              </p>

              <Link
                href={backHref}
                className="mt-6 inline-flex items-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
              >
                Torna indietro
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const badge = badgeInfo(pro);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_36%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8e1eb] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:border-[#c9d5e2] hover:bg-[#f8fbff]"
            >
              ← Indietro
            </button>

            <Link
              href="/servizi"
              className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
            >
              Tutti i servizi
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] border border-[#e3e9f0] bg-[radial-gradient(circle_at_top_left,rgba(227,233,240,0.45),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                  Scheda servizio
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
                  {pro.display_name}
                </h1>

                <p className="mt-3 text-sm font-medium leading-7 text-[#55657d] sm:text-base">
                  {macroLabel(pro.category)} • {pro.city}{" "}
                  {pro.province ? `(${pro.province})` : ""}
                </p>
              </div>

              <span
                className={[
                  "inline-flex rounded-full px-4 py-2 text-xs font-semibold shadow-sm",
                  badge.className,
                ].join(" ")}
                title={badge.title}
              >
                {badge.label}
              </span>
            </div>

            {tagLabels.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {tagLabels.map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-[#dbe5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#55657d]"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_30px_rgba(48,72,111,0.05)] sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] shadow-[0_10px_24px_rgba(48,72,111,0.22)]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                      Presentazione
                    </p>
                    <h2 className="text-lg font-semibold text-[#30486f]">Descrizione</h2>
                  </div>
                </div>

                {pro.description ? (
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#55657d]">
                    {pro.description}
                  </p>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-[#55657d]">
                    Scheda in aggiornamento.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_30px_rgba(48,72,111,0.05)] sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] shadow-[0_10px_24px_rgba(48,72,111,0.22)]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                      Richieste
                    </p>
                    <h2 className="text-lg font-semibold text-[#30486f]">Contatta</h2>
                  </div>
                </div>

                {isOwner ? (
                  <p className="mt-5 text-sm leading-7 text-[#55657d]">
                    Sei il proprietario della scheda. Le richieste di contatto arriveranno nel tuo
                    portale.
                  </p>
                ) : (
                  <>
                    <p className="mt-5 text-sm leading-7 text-[#55657d]">
                      Invia una richiesta direttamente da qui. Il professionista la riceverà nel suo
                      portale UNIMALIA.
                    </p>

                    <label className="mt-6 block text-sm font-semibold text-[#30486f]">
                      Messaggio
                    </label>

                    <textarea
                      className="mt-2 w-full rounded-[20px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                      rows={5}
                      placeholder="Es. Vorrei maggiori informazioni su disponibilità, costi o modalità del servizio."
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={sendRequest}
                      disabled={sending}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#30486f] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                    >
                      {sending ? "Invio..." : "Invia richiesta"}
                    </button>

                    {info && (
                      <p className="mt-4 text-sm font-medium leading-7 text-[#55657d]">{info}</p>
                    )}

                    <div className="mt-5 rounded-[20px] border border-[#e3e9f0] bg-[#f8fbff] px-4 py-3">
                      <p className="text-xs leading-6 text-[#5f708a]">
                        Anti-spam attivo: l’invio dei messaggi è limitato per ridurre abusi e
                        contatti automatici.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_30px_rgba(48,72,111,0.05)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                  Dove si trova
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#30486f]">Indirizzo</h2>
                <p className="mt-4 text-sm leading-7 text-[#55657d]">
                  {pro.address ?? "Non disponibile"}
                </p>
              </div>

              <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_30px_rgba(48,72,111,0.05)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                  Informazioni utili
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#30486f]">Contatti</h2>

                <div className="mt-5 space-y-4 text-sm text-[#55657d]">
                  <div className="rounded-[20px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f708a]">
                      Telefono
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#30486f]">
                      {pro.phone ? pro.phone : "Non disponibile"}
                    </span>
                  </div>

                  <div className="rounded-[20px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f708a]">
                      Email
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#30486f]">
                      {pro.email ? pro.email : "Non disponibile"}
                    </span>
                  </div>

                  <div className="rounded-[20px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f708a]">
                      Sito web
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#30486f]">
                      {pro.website ? (
                        <a
                          href={pro.website}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-[#9fb0c4] underline-offset-4 transition hover:text-[#243750]"
                        >
                          Apri sito
                        </a>
                      ) : (
                        "Non disponibile"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}