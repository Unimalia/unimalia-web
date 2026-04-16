"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "ponte_arcobaleno", label: "Ponte dellâ€™Arcobaleno" },
  { key: "pet_detective", label: "Pet Detective" },
  { key: "altro", label: "Altro" },
] as const;

type ActivityMode = "business" | "hobby";
type ProfessionalType = "generic" | "veterinarian";

function isEmailValid(email: string) {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isProvinceValid(value: string) {
  return /^[A-Za-z]{2}$/.test(value.trim());
}

function isTaxCodeValid(value: string) {
  return /^[A-Za-z0-9]{16}$/.test(value.trim());
}

function isVatNumberValid(value: string) {
  return /^\d{11}$/.test(value.trim());
}

function isSdiValid(value: string) {
  return /^[A-Za-z0-9]{7}$/.test(value.trim());
}

function normalizeProvince(value: string) {
  return value.trim().toUpperCase();
}

function normalizeTaxCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizeSdi(value: string) {
  return value.trim().toUpperCase();
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

function getDefaultCategoryByProfessionalType(professionalType: ProfessionalType) {
  return professionalType === "veterinarian" ? "veterinari" : "altro";
}

export default function NuovoProfessionistaClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("altro");
  const [activityMode, setActivityMode] = useState<ActivityMode>("business");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [pec, setPec] = useState("");
  const [sdiCode, setSdiCode] = useState("");

  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [vetStructureType, setVetStructureType] = useState("clinica");
  const [directorName, setDirectorName] = useState("");
  const [directorOrderProvince, setDirectorOrderProvince] = useState("");
  const [directorFnoviNumber, setDirectorFnoviNumber] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [authorizationIssuer, setAuthorizationIssuer] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("generic");

  const allowedMacro = useMemo(
    () => getAllowedMacroByProfessionalType(professionalType),
    [professionalType]
  );

  const isVeterinary = useMemo(() => category === "veterinari", [category]);
  const canBeHobby = useMemo(() => category === "pet_sitter" || category === "altro", [category]);
  const isBusiness = useMemo(() => {
    if (isVeterinary) return true;
    if (canBeHobby) return activityMode === "business";
    return true;
  }, [activityMode, canBeHobby, isVeterinary]);

  useEffect(() => {
    if (isVeterinary) {
      setActivityMode("business");
    } else if (!canBeHobby) {
      setActivityMode("business");
    }
  }, [canBeHobby, isVeterinary]);

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!alive) return;

      const resolvedProfessionalType = getProfessionalTypeFromUser(user);

      setUserId(user.id);
      setProfessionalType(resolvedProfessionalType);
      setCategory(getDefaultCategoryByProfessionalType(resolvedProfessionalType));

      const { data: existing } = await supabase
        .from("professionals")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        router.replace("/professionisti");
        return;
      }

      setLoading(false);
    }

    init();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!allowedMacro.some((item) => item.key === category)) {
      setCategory(getDefaultCategoryByProfessionalType(professionalType));
    }
  }, [allowedMacro, category, professionalType]);

  async function save() {
    setError(null);

    if (!userId) {
      setError("Devi essere loggato per creare una scheda.");
      return;
    }

    if (professionalType === "generic" && category === "veterinari") {
      setError("Un professionista non veterinario non puÃ² creare una scheda veterinaria.");
      return;
    }

    if (professionalType === "veterinarian" && category !== "veterinari") {
      setError("Un account veterinario deve usare la categoria Veterinari.");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Inserisci un nome valido (minimo 2 caratteri).");
      return;
    }

    if (city.trim().length < 2) {
      setError("Inserisci una cittÃ  valida.");
      return;
    }

    if (!isProvinceValid(province)) {
      setError("Inserisci una provincia valida di 2 lettere (es. FI).");
      return;
    }

    if (address.trim().length < 5) {
      setError("Inserisci un indirizzo valido (es. Via Roma 10).");
      return;
    }

    if (phone.trim().length < 6) {
      setError("Inserisci un numero di telefono valido.");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    if (firstName.trim().length < 2) {
      setError("Inserisci il nome.");
      return;
    }

    if (lastName.trim().length < 2) {
      setError("Inserisci il cognome.");
      return;
    }

    if (!isTaxCodeValid(taxCode)) {
      setError("Inserisci un codice fiscale valido di 16 caratteri.");
      return;
    }

    if (isBusiness) {
      if (businessName.trim().length < 2) {
        setError("Inserisci il nome attivitÃ  / ragione sociale.");
        return;
      }

      if (legalName.trim().length < 2) {
        setError("Inserisci la ragione sociale / denominazione legale.");
        return;
      }

      if (!isVatNumberValid(vatNumber)) {
        setError("Inserisci una partita IVA valida di 11 cifre.");
        return;
      }

      if (!isEmailValid(pec)) {
        setError("Inserisci una PEC valida.");
        return;
      }

      if (!isSdiValid(sdiCode)) {
        setError("Inserisci un codice SDI valido di 7 caratteri.");
        return;
      }
    }

    if (isVeterinary) {
      if (directorName.trim().length < 3) {
        setError("Inserisci il nome del direttore sanitario.");
        return;
      }

      if (!isProvinceValid(directorOrderProvince)) {
        setError("Inserisci la provincia dell'Ordine del direttore sanitario (2 lettere).");
        return;
      }

      if (directorFnoviNumber.trim().length < 2) {
        setError("Inserisci il numero iscrizione FNOVI.");
        return;
      }

      if (authorizationCode.trim().length < 2) {
        setError("Inserisci gli estremi dell'autorizzazione sanitaria.");
        return;
      }

      if (authorizationIssuer.trim().length < 2) {
        setError("Inserisci l'ente che ha rilasciato l'autorizzazione.");
        return;
      }
    }

    const verificationLevel = isVeterinary
      ? "regulated_vet"
      : isBusiness
        ? "business"
        : "basic";

    setSaving(true);

    try {
      await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

      const { error } = await supabase.from("professionals").insert({
        owner_id: userId,
        approved: false,
        is_vet: isVeterinary,
        public_visible: false,
        verification_status: "pending",
        verification_level: verificationLevel,
        is_business: isBusiness,

        display_name: displayName.trim(),
        category,

        first_name: firstName.trim(),
        last_name: lastName.trim(),
        business_name: isBusiness ? businessName.trim() : null,
        legal_name: isBusiness ? legalName.trim() : null,
        tax_code: normalizeTaxCode(taxCode),
        vat_number: isBusiness ? vatNumber.trim() : null,
        pec: isBusiness ? pec.trim() : null,
        sdi_code: isBusiness ? normalizeSdi(sdiCode) : null,
        invoice_receiver_type: isBusiness ? "sdi" : "none",

        city: city.trim(),
        province: normalizeProvince(province),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim() || null,
        description: description.trim() || null,

        vet_structure_type: isVeterinary ? vetStructureType : null,
        director_name: isVeterinary ? directorName.trim() : null,
        director_order_province: isVeterinary ? normalizeProvince(directorOrderProvince) : null,
        director_fnovi_number: isVeterinary ? directorFnoviNumber.trim() : null,
        authorization_code: isVeterinary ? authorizationCode.trim() : null,
        authorization_issuer: isVeterinary ? authorizationIssuer.trim() : null,
      });

      if (error) {
        throw error;
      }

      router.replace("/professionisti/skill");
    } catch {
      setError("Errore nel salvataggio. Controlla i campi e riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-sm text-zinc-700">Caricamentoâ€¦</p>
      </main>
    );
  }

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/professionisti")}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          â† Indietro
        </button>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:underline">
            Home
          </Link>
          <Link href="/servizi" className="text-sm font-medium text-zinc-600 hover:underline">
            Servizi
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight">Crea scheda professionista</h1>
        <p className="mt-3 text-sm text-zinc-700">
          Compila la scheda. Dopo salverai le skill. La pubblicazione pubblica avverrÃ  solo dopo
          verifica.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Nome attivitÃ  / professionista *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Es. Clinica Veterinaria XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Categoria *</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
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

          {canBeHobby ? (
            <div>
              <label className="block text-sm font-medium">Tipo profilo *</label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={activityMode}
                onChange={(e) => setActivityMode(e.target.value as ActivityMode)}
              >
                <option value="business">AttivitÃ  / professionista</option>
                <option value="hobby">Privato / hobbistico</option>
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium">Nome *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Cognome *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Cognome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Codice fiscale *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
              placeholder="RSSMRA80A01H501U"
              maxLength={16}
            />
          </div>

          {isBusiness ? (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Nome attivitÃ  / ragione sociale *
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Es. Clinica Veterinaria XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Denominazione legale *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Es. XYZ S.r.l."
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Partita IVA *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="12345678901"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">PEC *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={pec}
                  onChange={(e) => setPec(e.target.value)}
                  placeholder="pec@pec.it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Codice SDI *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
                  value={sdiCode}
                  onChange={(e) => setSdiCode(e.target.value.toUpperCase())}
                  placeholder="ABC1234"
                  maxLength={7}
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="block text-sm font-medium">CittÃ  *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Es. Firenze"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Provincia * (es. FI)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
              value={province}
              onChange={(e) => setProvince(e.target.value.toUpperCase())}
              placeholder="FI"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Indirizzo *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via Roma 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Telefono *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sito (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {isVeterinary ? (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Tipologia struttura veterinaria *
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                  value={vetStructureType}
                  onChange={(e) => setVetStructureType(e.target.value)}
                >
                  <option value="studio">Studio veterinario</option>
                  <option value="ambulatorio">Ambulatorio veterinario</option>
                  <option value="clinica">Clinica veterinaria</option>
                  <option value="ospedale">Ospedale veterinario</option>
                  <option value="laboratorio">Laboratorio veterinario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Direttore sanitario *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Nome e cognome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Provincia Ordine *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
                  value={directorOrderProvince}
                  onChange={(e) => setDirectorOrderProvince(e.target.value.toUpperCase())}
                  placeholder="FI"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Numero iscrizione FNOVI *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={directorFnoviNumber}
                  onChange={(e) => setDirectorFnoviNumber(e.target.value)}
                  placeholder="Numero iscrizione"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Estremi autorizzazione sanitaria *
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={authorizationCode}
                  onChange={(e) => setAuthorizationCode(e.target.value)}
                  placeholder="Numero / protocollo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Ente rilasciante *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={authorizationIssuer}
                  onChange={(e) => setAuthorizationIssuer(e.target.value)}
                  placeholder="ASL / Comune / Regione..."
                />
              </div>
            </>
          ) : null}

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Descrizione (opzionale)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Servizi, orari, specializzazioni..."
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Continua: scegli le skill â†’"}
        </button>

        <p className="mt-3 text-xs text-zinc-500">
          * Campi obbligatori. La scheda verrÃ  salvata in stato di verifica.
        </p>
      </div>
    </main>
  );
}
