"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
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

type ProfessionalType = "generic" | "veterinarian";

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "pet_detective", label: "Pet Detective" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

type LocalPrefs = {
  defaultView: "dashboard" | "animali" | "scansiona";
  compactMode: boolean;
  internalNotesEnabled: boolean;
  notifyAccessRequests: boolean;
  notifyConsults: boolean;
  notifyClinicalUpdates: boolean;
};

const DEFAULT_PREFS: LocalPrefs = {
  defaultView: "dashboard",
  compactMode: false,
  internalNotesEnabled: true,
  notifyAccessRequests: true,
  notifyConsults: true,
  notifyClinicalUpdates: true,
};

function isEmailValid(email: string) {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function normalizeProvince(value: string) {
  return value.trim().toUpperCase();
}

function prefsStorageKey(userId: string) {
  return `unimalia:pro-settings:${userId}`;
}

function getProfessionalTypeFromUser(user: {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const raw =
    user?.app_metadata?.professional_type ?? user?.user_metadata?.professional_type ?? "generic";

  return raw === "veterinarian" ? "veterinarian" : "generic";
}

function getAllowedMacroByProfessionalType(professionalType: ProfessionalType) {
  if (professionalType === "veterinarian") {
    return MACRO;
  }

  return MACRO.filter((item) => item.key !== "veterinari");
}

export default function ProfessionistiImpostazioniPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("generic");

  const [pro, setPro] = useState<Professional | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("altro");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");

  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_PREFS);

  const allowedMacro = useMemo(
    () => getAllowedMacroByProfessionalType(professionalType),
    [professionalType]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/professionisti/login");
        return;
      }

      if (!alive) return;

      const resolvedProfessionalType = getProfessionalTypeFromUser(user);

      setUserId(user.id);
      setUserEmail(user.email ?? "");
      setProfessionalType(resolvedProfessionalType);

      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select(
          "id,owner_id,display_name,category,city,province,address,phone,email,website,description"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (proErr || !proData || proData.length === 0) {
        setError("Scheda professionista non trovata.");
        setLoading(false);
        return;
      }

      const p = proData[0] as Professional;

      setPro(p);
      setDisplayName(p.display_name ?? "");
      setCategory(
        resolvedProfessionalType === "generic" && p.category === "veterinari"
          ? "altro"
          : (p.category ?? "")
      );
      setPhone(p.phone ?? "");
      setEmail(p.email ?? "");
      setWebsite(p.website ?? "");
      setAddress(p.address ?? "");
      setCity(p.city ?? "");
      setProvince(p.province ?? "");
      setDescription(p.description ?? "");

      try {
        const raw = localStorage.getItem(prefsStorageKey(user.id));
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<LocalPrefs>;
          setPrefs({
            ...DEFAULT_PREFS,
            ...parsed,
          });
        }
      } catch {
        setPrefs(DEFAULT_PREFS);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!allowedMacro.some((item) => item.key === category)) {
      setCategory(professionalType === "veterinarian" ? "veterinari" : "altro");
    }
  }, [allowedMacro, category, professionalType]);

  const currentDefaultViewLabel = useMemo(() => {
    switch (prefs.defaultView) {
      case "animali":
        return "Animali in gestione";
      case "scansiona":
        return "Scansiona";
      default:
        return "Dashboard";
    }
  }, [prefs.defaultView]);

  async function saveProfile() {
    setError(null);
    setInfo(null);

    if (!pro) {
      setError("Scheda professionista non trovata.");
      return;
    }

    if (professionalType === "generic" && category === "veterinari") {
      setError("Un professionista non veterinario non può usare la categoria Veterinari.");
      return;
    }

    if (professionalType === "veterinarian" && category !== "veterinari") {
      setError("Un account veterinario deve mantenere la categoria Veterinari.");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Inserisci un nome struttura / professionista valido.");
      return;
    }

    if (city.trim().length < 2) {
      setError("Inserisci una città valida.");
      return;
    }

    if (province.trim().length !== 2) {
      setError("Inserisci una provincia valida di 2 lettere.");
      return;
    }

    if (phone.trim().length < 6) {
      setError("Inserisci un numero di telefono valido.");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Inserisci una email valida.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Inserisci un indirizzo valido.");
      return;
    }

    setSavingProfile(true);

    try {
      const payload = {
        display_name: displayName.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim() || null,
        address: address.trim(),
        city: city.trim(),
        province: normalizeProvince(province),
        description: description.trim() || null,
      };

      const { error: upErr } = await supabase.from("professionals").update(payload).eq("id", pro.id);

      if (upErr) {
        throw upErr;
      }

      setPro((prev) =>
        prev
          ? {
              ...prev,
              display_name: displayName.trim(),
              category,
              phone: phone.trim(),
              email: email.trim(),
              website: website.trim() || null,
              address: address.trim(),
              city: city.trim(),
              province: normalizeProvince(province),
              description: description.trim() || null,
            }
          : prev
      );

      setInfo("Profilo professionista salvato ✅");
    } catch {
      setError("Errore nel salvataggio del profilo. Riprova.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreferences() {
    setError(null);
    setInfo(null);

    if (!userId) {
      setError("Utente non disponibile.");
      return;
    }

    setSavingPrefs(true);

    try {
      localStorage.setItem(prefsStorageKey(userId), JSON.stringify(prefs));
      setInfo("Preferenze e notifiche salvate su questo dispositivo ✅");
    } catch {
      setError("Errore nel salvataggio locale delle preferenze.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      router.replace("/professionisti/login");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Impostazioni</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Gestisci profilo professionista, preferenze operative, notifiche e sicurezza del portale.
        </p>
      </div>

      {error || info ? (
        <div
          className={[
            "rounded-2xl border p-4 text-sm shadow-sm",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error || info}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">
            PROFILO PROFESSIONISTA
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Profilo</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Nome struttura, contatti, indirizzo, categoria e dati pubblici della scheda.
          </p>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Nome struttura / professionista
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Categoria</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {allowedMacro.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Telefono</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Sito</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Indirizzo</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-900">Città</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900">Provincia</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
                  value={province}
                  onChange={(e) => setProvince(e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {savingProfile ? "Salvataggio..." : "Salva profilo"}
              </button>

              <Link
                href="/professionisti/nuovo/modifica"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Modifica scheda completa
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">PREFERENZE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Preferenze</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Configurazioni del portale e personalizzazioni operative. Salvataggio locale su questo
            dispositivo.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Vista iniziale dashboard
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={prefs.defaultView}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    defaultView: e.target.value as LocalPrefs["defaultView"],
                  }))
                }
              >
                <option value="dashboard">Dashboard</option>
                <option value="animali">Animali in gestione</option>
                <option value="scansiona">Scansiona</option>
              </select>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.compactMode}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    compactMode: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Modalità compatta</p>
                <p className="text-xs text-zinc-500">
                  Riduce spazi e densità dei contenuti nel portale.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.internalNotesEnabled}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    internalNotesEnabled: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Preferenze operative struttura
                </p>
                <p className="text-xs text-zinc-500">
                  Mantiene attive le opzioni operative locali del portale.
                </p>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">NOTIFICHE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Notifiche</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Gestione avvisi per richieste accesso, consulti e aggiornamenti clinici. Salvataggio
            locale su questo dispositivo.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyAccessRequests}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyAccessRequests: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Richieste accesso</p>
                <p className="text-xs text-zinc-500">
                  Avvisi per nuove richieste o cambi di stato.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyConsults}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyConsults: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Consulti e messaggi</p>
                <p className="text-xs text-zinc-500">
                  Avvisi per consulti in arrivo e messaggi dal portale.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyClinicalUpdates}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyClinicalUpdates: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Aggiornamenti clinici e alert
                </p>
                <p className="text-xs text-zinc-500">
                  Avvisi per attività cliniche rilevanti e aggiornamenti rapidi.
                </p>
              </div>
            </label>

            <button
              type="button"
              onClick={savePreferences}
              disabled={savingPrefs}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingPrefs ? "Salvataggio..." : "Salva preferenze e notifiche"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">SICUREZZA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Sicurezza</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sessione corrente, logout e accessi collegati all’account professionale.
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Sessione attiva</p>
              <p className="mt-1 text-sm text-zinc-600">
                Account:{" "}
                <span className="font-medium text-zinc-800">
                  {userEmail || "Non disponibile"}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Vista iniziale preferita: {currentDefaultViewLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Gestione accessi</p>
              <p className="mt-1 text-sm text-zinc-600">
                Controlla richieste accesso e stato operativo della tua area professionisti.
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/professionisti/richieste-accesso"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Apri richieste accesso
                </Link>

                {pro ? (
                  <Link
                    href={`/servizi/${pro.id}?from=professionisti`}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Vedi scheda pubblica
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Logout e controllo accessi</p>
              <p className="mt-1 text-sm text-zinc-600">
                Esci in sicurezza dal portale professionisti.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {loggingOut ? "Uscita..." : "Logout dal portale"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}