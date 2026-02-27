// src/app/professionisti/animali/[id]/verifica/page.tsx

"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfessionalRow = {
  id: string;
  owner_id: string;
  is_vet: boolean;
  approved: boolean | null;
};

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  owner_id: string;
  chip_number: string | null;
  microchip_verified: boolean;
  unimalia_code: string;
};

type ClinicEventRow = {
  id: string;
  event_date: string;
  type: string;
  title: string;
  description: string | null;
  source: "owner" | "professional";
  verified_at: string | null;
  verified_by: string | null;
};

function normalizeChip(raw: string) {
  return (raw || "")
    .trim()
    .replace(/^microchip[:\s]*/i, "")
    .replace(/^chip[:\s]*/i, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z\-]/g, "");
}

const typeLabel = (t: string) => {
  switch (t) {
    case "visit":
      return "Visita";
    case "vaccine":
      return "Vaccinazione";
    case "exam":
      return "Esame";
    case "therapy":
      return "Terapia";
    case "note":
      return "Nota";
    case "document":
      return "Documento";
    case "emergency":
      return "Emergenza";
    default:
      return t;
  }
};

export default function VerificaMicrochipPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const animalId = params?.id;

  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);

  const [isVet, setIsVet] = useState(false);
  const [proNameHint, setProNameHint] = useState<string>("");

  const [animal, setAnimal] = useState<AnimalRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Azione: verifica / correzione chip
  const [chipInput, setChipInput] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleanedChip = useMemo(() => normalizeChip(chipInput), [chipInput]);

  // Cartella clinica (validazione)
  const [clinicEvents, setClinicEvents] = useState<ClinicEventRow[]>([]);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [verifyingEventId, setVerifyingEventId] = useState<string | null>(null);

  async function getBearer() {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token || null;
  }

  async function loadClinicEvents(aid: string) {
    setClinicLoading(true);
    try {
      const token = await getBearer();
      if (!token) return;

      const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(aid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Errore caricamento eventi clinici");

      setClinicEvents(j?.events || []);
    } catch (e: any) {
      // non blocchiamo tutta la pagina, mostriamo solo messaggio
      setSaveMsg(null);
      setError(e?.message || "Errore caricamento cartella clinica.");
    } finally {
      setClinicLoading(false);
    }
  }

  async function verifyClinicEvent(eventId: string) {
    setVerifyingEventId(eventId);
    setError(null);

    try {
      const token = await getBearer();
      if (!token) throw new Error("Sessione non valida.");

      const res = await fetch(`/api/clinic-events/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Errore validazione");

      // refresh lista
      if (animalId) await loadClinicEvents(animalId);
    } catch (e: any) {
      setError(e?.message || "Errore durante la validazione.");
    } finally {
      setVerifyingEventId(null);
    }
  }

  useEffect(() => {
    let alive = true;

    async function boot() {
      setLoading(true);
      setError(null);
      setSaveMsg(null);

      // 1) Auth
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // 2) Check: deve essere professionista veterinario
      setCheckingRole(true);
      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select("id,owner_id,is_vet,approved")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (proErr) {
        setError("Errore nel controllo accesso professionista.");
        setCheckingRole(false);
        setLoading(false);
        return;
      }

      const pro = proData as ProfessionalRow | null;
      const okVet = !!pro && pro.is_vet === true;

      setIsVet(okVet);
      setProNameHint(okVet ? "Veterinario autorizzato" : "Accesso non autorizzato");
      setCheckingRole(false);

      if (!okVet) {
        setError("Questa sezione è riservata ai veterinari autorizzati.");
        setLoading(false);
        return;
      }

      // 3) Carica animale
      if (!animalId) {
        setError("ID animale mancante.");
        setLoading(false);
        return;
      }

      const { data: aData, error: aErr } = await supabase
        .from("animals")
        .select("id,name,species,owner_id,chip_number,microchip_verified,unimalia_code")
        .eq("id", animalId)
        .single();

      if (!alive) return;

      if (aErr || !aData) {
        setError(
          aErr?.message ||
            "Non riesco a caricare l’animale. Se sei veterinario ma vedi questo errore, manca la policy di lettura per veterinari."
        );
        setLoading(false);
        return;
      }

      const a = aData as AnimalRow;
      setAnimal(a);
      setChipInput(a.chip_number || "");

      // 4) Carica eventi clinici (via API admin + gate vet)
      await loadClinicEvents(a.id);

      setLoading(false);
    }

    boot();
    return () => {
      alive = false;
    };
  }, [animalId, router]);

  async function verifyMicrochip() {
    setSaveMsg(null);
    setError(null);

    if (!animal) return;

    const currentChip = normalizeChip(animal.chip_number || "");
    const candidate = cleanedChip;

    // se non c'è chip nel profilo, obbliga inserimento
    if (!candidate) {
      setSaveMsg("Inserisci il numero del microchip prima di verificare.");
      return;
    }

    if (candidate.length < 10) {
      setSaveMsg("Numero microchip non valido (troppo corto). Controlla e riprova.");
      return;
    }

    setSaving(true);
    try {
      // aggiorniamo chip_number se diverso + set verified=true
      const patch: any = {
        microchip_verified: true,
      };

      if (candidate !== currentChip) {
        patch.chip_number = candidate;
      }

      const { error: upErr } = await supabase.from("animals").update(patch).eq("id", animal.id);

      if (upErr) throw upErr;

      // aggiorna UI
      setAnimal((prev) =>
        prev
          ? {
              ...prev,
              chip_number: patch.chip_number ?? prev.chip_number,
              microchip_verified: true,
            }
          : prev
      );

      setSaveMsg("Microchip verificato ✅");
    } catch (e: any) {
      setError(e?.message || "Errore durante la verifica. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Verifica microchip</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verifica microchip</h1>
          <p className="mt-2 text-sm text-zinc-600">{proNameHint}</p>
        </div>

        {/* back “interno” al portale */}
        <Link href="/professionisti" className="text-sm text-zinc-600 hover:underline">
          ← Portale
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error}
          <div className="mt-3">
            <Link href="/professionisti" className="text-sm text-zinc-700 hover:underline">
              Torna al portale
            </Link>
          </div>
        </div>
      )}

      {!error && !checkingRole && isVet && animal && (
        <div className="mt-6">
          {/* Box microchip */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">
                  {animal.name} <span className="text-zinc-500">•</span>{" "}
                  <span className="text-zinc-700">{animal.species}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Stato microchip:{" "}
                  <span className="font-medium">
                    {animal.microchip_verified ? "Verificato ✅" : "Non verificato"}
                  </span>
                </p>
              </div>

              {/* link “interno” alla scheda pro dell’animale */}
              <Link
                href={`/professionisti/animali/${animal.id}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                ← Scheda animale
              </Link>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-700">
                Inserisci il microchip (o correggilo) e conferma la verifica.
              </p>

              <label className="mt-4 block text-sm font-medium text-zinc-900">Numero microchip</label>
              <input
                value={chipInput}
                onChange={(e) => setChipInput(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                placeholder="Es. 380260123456789"
                disabled={saving}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Se l’animale non ha microchip: il suo codice digitale è UNIMALIA ID (
                {`UNIMALIA:${animal.unimalia_code}`}).
              </p>

              <button
                type="button"
                onClick={verifyMicrochip}
                disabled={saving}
                className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {saving ? "Verifica in corso…" : "Verifica microchip ✅"}
              </button>

              {saveMsg && <p className="mt-3 text-sm text-zinc-700">{saveMsg}</p>}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Nota: la verifica abilita l’uso del microchip come identificativo digitale definitivo su UNIMALIA.
            </p>
          </div>

          {/* Cartella clinica (validazione) */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Cartella clinica (validazione)</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Eventi inseriti dal proprietario: puoi validarli come veterinario.
                </p>
              </div>

              <button
                type="button"
                onClick={() => animalId && loadClinicEvents(animalId)}
                disabled={clinicLoading}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                {clinicLoading ? "Aggiornamento…" : "Aggiorna"}
              </button>
            </div>

            {clinicLoading ? (
              <p className="mt-4 text-sm text-zinc-700">Caricamento eventi…</p>
            ) : clinicEvents.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-700">Nessun evento presente.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {clinicEvents.map((ev) => {
                  const isVerified = ev.source === "professional" || !!ev.verified_at;
                  return (
                    <div key={ev.id} className="rounded-xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-zinc-500">
                            {new Date(ev.event_date).toLocaleString("it-IT")}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">
                            {typeLabel(ev.type)}
                          </div>
                          {ev.description ? (
                            <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                              {ev.description}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {isVerified ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              ✓ Verificato professionista
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              ⏳ Da validare
                            </span>
                          )}

                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => verifyClinicEvent(ev.id)}
                              disabled={verifyingEventId === ev.id}
                              className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                            >
                              {verifyingEventId === ev.id ? "Validazione…" : "Valida"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs text-zinc-500">
              Nota: la validazione imposta “verified_at/verified_by” e marca l’evento come professionista.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}