"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  is_business: boolean;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  legal_name: string | null;
  tax_code: string | null;
  vat_number: string | null;
  pec: string | null;
  sdi_code: string | null;
  invoice_receiver_type: string | null;
  vet_structure_type: string | null;
  director_name: string | null;
  director_order_province: string | null;
  director_fnovi_number: string | null;
  authorization_code: string | null;
  authorization_issuer: string | null;
};

type Tag = {
  id: string;
  macro: string;
  key: string;
  label: string;
  sort_order: number;
  active: boolean;
};

type TagLink = {
  professional_id: string;
  tag_id: string;
};

type ActivityMode = "business" | "hobby";

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
] as const;

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

function statusLabel(pro: Professional | null) {
  if (!pro) return "—";

  if (pro.verification_level === "regulated_vet") {
    if (pro.verification_status === "verified" && pro.public_visible) {
      return "Struttura veterinaria verificata";
    }
    if (pro.verification_status === "rejected") {
      return "Verifica rifiutata";
    }
    return "Struttura veterinaria in verifica";
  }

  if (pro.verification_level === "business") {
    if (pro.verification_status === "verified" && pro.public_visible) {
      return "Attività verificata";
    }
    if (pro.verification_status === "rejected") {
      return "Verifica rifiutata";
    }
    return "Attività in verifica";
  }

  if (pro.verification_status === "verified" && pro.public_visible) {
    return "Profilo base verificato";
  }
  if (pro.verification_status === "rejected") {
    return "Verifica rifiutata";
  }
  return "Profilo base in verifica";
}

export default function ModificaProfessionistaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pro, setPro] = useState<Professional | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<TagLink[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("veterinari");
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

  const [selected, setSelected] = useState<Set<string>>(new Set());

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

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select(
          [
            "id",
            "owner_id",
            "approved",
            "display_name",
            "category",
            "city",
            "province",
            "address",
            "phone",
            "email",
            "website",
            "description",
            "verification_status",
            "verification_level",
            "public_visible",
            "is_business",
            "first_name",
            "last_name",
            "business_name",
            "legal_name",
            "tax_code",
            "vat_number",
            "pec",
            "sdi_code",
            "invoice_receiver_type",
            "vet_structure_type",
            "director_name",
            "director_order_province",
            "director_fnovi_number",
            "authorization_code",
            "authorization_issuer",
          ].join(",")
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (proErr || !proData || proData.length === 0) {
        router.replace("/professionisti/nuovo");
        return;
      }

      const p = proData[0] as unknown as Professional;
      setPro(p);

      setDisplayName(p.display_name ?? "");
      setCategory(p.category ?? "");
      setActivityMode(p.is_business ? "business" : "hobby");

      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setBusinessName(p.business_name ?? "");
      setLegalName(p.legal_name ?? "");
      setTaxCode(p.tax_code ?? "");
      setVatNumber(p.vat_number ?? "");
      setPec(p.pec ?? "");
      setSdiCode(p.sdi_code ?? "");

      setCity(p.city ?? "");
      setProvince(p.province ?? "");
      setAddress(p.address ?? "");
      setPhone(p.phone ?? "");
      setEmail(p.email ?? "");
      setWebsite(p.website ?? "");
      setDescription(p.description ?? "");

      setVetStructureType(p.vet_structure_type ?? "clinica");
      setDirectorName(p.director_name ?? "");
      setDirectorOrderProvince(p.director_order_province ?? "");
      setDirectorFnoviNumber(p.director_fnovi_number ?? "");
      setAuthorizationCode(p.authorization_code ?? "");
      setAuthorizationIssuer(p.authorization_issuer ?? "");

      const { data: tagData, error: tagErr } = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order,active")
        .eq("active", true)
        .order("macro", { ascending: true })
        .order("sort_order", { ascending: true });

      if (tagErr) {
        setError("Errore nel caricamento delle skill.");
        setTags([]);
      } else {
        setTags((tagData as Tag[]) || []);
      }

      const { data: linkData, error: linkErr } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", p.id);

      if (linkErr) {
        setError("Errore nel caricamento delle skill selezionate.");
        setLinks([]);
        setSelected(new Set());
      } else {
        const l = (linkData as TagLink[]) || [];
        setLinks(l);
        setSelected(new Set(l.map((x) => x.tag_id)));
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const tagsForMacro = useMemo(() => {
    return tags.filter((t) => t.macro === category);
  }, [tags, category]);

  function toggleTag(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setError(null);

    if (!pro) return;

    if (displayName.trim().length < 2) {
      setError("Inserisci un nome valido (minimo 2 caratteri).");
      return;
    }

    if (city.trim().length < 2) {
      setError("Inserisci una città valida.");
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
        setError("Inserisci il nome attività / ragione sociale.");
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
      const { error: upErr } = await supabase
        .from("professionals")
        .update({
          approved: false,
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
          email: email.trim(),
          website: website.trim() || null,
          description: description.trim() || null,

          vet_structure_type: isVeterinary ? vetStructureType : null,
          director_name: isVeterinary ? directorName.trim() : null,
          director_order_province: isVeterinary ? normalizeProvince(directorOrderProvince) : null,
          director_fnovi_number: isVeterinary ? directorFnoviNumber.trim() : null,
          authorization_code: isVeterinary ? authorizationCode.trim() : null,
          authorization_issuer: isVeterinary ? authorizationIssuer.trim() : null,
        })
        .eq("id", pro.id);

      if (upErr) throw upErr;

      const oldSet = new Set(links.map((x) => x.tag_id));
      const newSet = selected;

      const toAdd = Array.from(newSet).filter((id) => !oldSet.has(id));
      const toRemove = Array.from(oldSet).filter((id) => !newSet.has(id));

      if (toRemove.length > 0) {
        const { error: delErr } = await supabase
          .from("professional_tag_links")
          .delete()
          .eq("professional_id", pro.id)
          .in("tag_id", toRemove);

        if (delErr) throw delErr;
      }

      if (toAdd.length > 0) {
        const payload = toAdd.map((tag_id) => ({
          professional_id: pro.id,
          tag_id,
        }));

        const { error: insErr } = await supabase
          .from("professional_tag_links")
          .insert(payload);

        if (insErr) throw insErr;
      }

      const { data: linkData } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", pro.id);

      const l = (linkData as TagLink[]) || [];
      setLinks(l);
      setSelected(new Set(l.map((x) => x.tag_id)));

      setPro((prev) =>
        prev
          ? {
              ...prev,
              approved: false,
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
              email: email.trim(),
              website: website.trim() || null,
              description: description.trim() || null,
              vet_structure_type: isVeterinary ? vetStructureType : null,
              director_name: isVeterinary ? directorName.trim() : null,
              director_order_province: isVeterinary
                ? normalizeProvince(directorOrderProvince)
                : null,
              director_fnovi_number: isVeterinary ? directorFnoviNumber.trim() : null,
              authorization_code: isVeterinary ? authorizationCode.trim() : null,
              authorization_issuer: isVeterinary ? authorizationIssuer.trim() : null,
            }
          : prev
      );

      router.replace("/professionisti/dashboard?pending=1");
    } catch (e: any) {
      setError("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-700">Caricamento…</p>;

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifica scheda</h1>
          <p className="mt-2 text-sm text-zinc-600">{statusLabel(pro)}</p>
        </div>

        <Link href="/professionisti" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Portale
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">Profilo in verifica</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-800">
          La scheda professionista è stata salvata correttamente ed è ora in revisione.
          La verifica richiede in genere 24/48 ore. Nel frattempo puoi aggiornare i dati,
          ma le funzioni riservate resteranno abilitate solo dopo approvazione.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">DATI SCHEDA</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Nome attività / professionista *</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Macro-categoria *</label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {MACRO.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {canBeHobby && (
              <div>
                <label className="block text-sm font-medium">Tipo profilo *</label>
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                  value={activityMode}
                  onChange={(e) => setActivityMode(e.target.value as ActivityMode)}
                >
                  <option value="business">Attività / professionista</option>
                  <option value="hobby">Privato / hobbistico</option>
                </select>
              </div>
            )}

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

            {isBusiness && (
              <>
                <div>
                  <label className="block text-sm font-medium">Nome attività / ragione sociale *</label>
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
            )}

            <div>
              <label className="block text-sm font-medium">Città *</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Provincia *</label>
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Telefono *</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email *</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Sito</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {isVeterinary && (
              <>
                <div>
                  <label className="block text-sm font-medium">Tipologia struttura veterinaria *</label>
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
                  <label className="block text-sm font-medium">Estremi autorizzazione sanitaria *</label>
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
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvataggio..." : "Salva e chiudi"}
          </button>

          <p className="mt-4 text-xs text-zinc-500">
            Ogni modifica riporta la scheda in verifica. La scheda pubblica mostrerà solo dati verificati.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">SKILL / SERVIZI</p>

          <p className="mt-3 text-sm text-zinc-700">
            Seleziona ciò che fai. Puoi aggiungere o togliere skill in qualsiasi momento.
          </p>

          <div className="mt-4 space-y-2">
            {tagsForMacro.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nessuna skill disponibile per questa macro (per ora).
              </p>
            ) : (
              tagsForMacro.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(t.id)}
                    onChange={() => toggleTag(t.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{t.label}</p>
                    <p className="text-xs text-zinc-500">{t.key}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Se non trovi una skill, la aggiungeremo nel catalogo (admin).
          </p>
        </div>
      </div>
    </main>
  );
}