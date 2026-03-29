"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

import { AdottaFilters } from "./adotta-filters";
import { AdottaResults } from "./adotta-results";

type Species = "dog" | "cat" | "other";
type ShelterType = "canile" | "gattile" | "rifugio";

type BreedOpt = { id: string; name: string };
type ShelterOpt = { id: string; name: string; type: ShelterType; city: string | null };
type CityRow = { city: string | null };
type DbRow = Record<string, unknown>;
type BreedRow = { id: string; name: string };
type ShelterRow = { id: string; name: string; type: ShelterType; city: string | null };

type AnimalRow = {
  id: string;
  name: string | null;
  species: "dog" | "cat" | "other";
  city: string | null;
  province: string | null;
  age_months: number | null;
  sex: "m" | "f" | null;
  size: "s" | "m" | "l" | null;
  is_mixed: boolean | null;
  photo_url: string | null;
  urgent: boolean | null;
  shelters?: {
    id: string;
    name: string | null;
    type: ShelterType | null;
    city: string | null;
  } | null;
} & DbRow;

const ADOPTION_TABLE = "adoption_animals";
const BREEDS_TABLE = "breeds";
const SHELTERS_TABLE = "shelters";

function getSpecies(sp: URLSearchParams): Species {
  const s = (sp.get("species") || "").toLowerCase();
  if (s === "cat" || s === "other") return s;
  return "dog";
}

function str(value: unknown) {
  return String(value ?? "").trim();
}

function boolFromUnknown(value: unknown) {
  if (typeof value === "boolean") return value;
  const v = String(value ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

function ageRangeMatches(ageMonths: number | null | undefined, range: string) {
  if (ageMonths == null) return false;

  if (range === "0-2") return ageMonths <= 24;
  if (range === "3-6") return ageMonths >= 36 && ageMonths <= 72;
  if (range === "7+") return ageMonths >= 84;

  return true;
}

function readAnimalShelterType(animal: DbRow) {
  return str(
    animal.shelter_type ??
      animal.structure_type ??
      animal.refuge_type ??
      (typeof animal.shelters === "object" && animal.shelters !== null
        ? (animal.shelters as { type?: unknown }).type
        : undefined)
  ).toLowerCase();
}

function readAnimalShelterId(animal: DbRow) {
  return str(
    animal.shelter_id ??
      animal.structure_id ??
      animal.refuge_id ??
      (typeof animal.shelters === "object" && animal.shelters !== null
        ? (animal.shelters as { id?: unknown }).id
        : undefined)
  );
}

function readAnimalBreedId(animal: DbRow) {
  return str(animal.breed_id ?? animal.breedId ?? "");
}

function readAnimalCity(animal: DbRow) {
  return str(
    animal.city ??
      animal.location_city ??
      (typeof animal.shelters === "object" && animal.shelters !== null
        ? (animal.shelters as { city?: unknown }).city
        : undefined)
  );
}

function readAnimalSex(animal: DbRow) {
  return str(animal.sex ?? "").toLowerCase();
}

function readAnimalSize(animal: DbRow) {
  return str(animal.size ?? "").toLowerCase();
}

function readAnimalAgeMonths(animal: DbRow) {
  const raw = animal.age_months;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw);
  return null;
}

function readAnimalMixed(animal: DbRow) {
  return boolFromUnknown(animal.is_mixed ?? animal.mixed);
}

function readAnimalUrgent(animal: DbRow) {
  return boolFromUnknown(animal.urgent);
}

function readAnimalSpecialNeeds(animal: DbRow) {
  return boolFromUnknown(animal.special_needs ?? animal.specialNeeds);
}

function readAnimalWithDogs(animal: DbRow) {
  return boolFromUnknown(animal.with_dogs ?? animal.compatible_with_dogs);
}

function readAnimalWithCats(animal: DbRow) {
  return boolFromUnknown(animal.with_cats ?? animal.compatible_with_cats);
}

function readAnimalWithKids(animal: DbRow) {
  return boolFromUnknown(animal.with_kids ?? animal.compatible_with_kids ?? animal.with_children);
}

function readAnimalHasPhoto(animal: DbRow) {
  return Boolean(str(animal.photo_url));
}

export function AdottaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const species = useMemo(() => getSpecies(sp), [sp]);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [breeds, setBreeds] = useState<BreedOpt[]>([]);
  const [shelters, setShelters] = useState<ShelterOpt[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [resultsLoading, setResultsLoading] = useState(true);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [adoptionTableMissing, setAdoptionTableMissing] = useState(false);

  const filters = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? "";
    return {
      species: (get("species") as Species) || species,
      city: get("city"),
      shelterType: get("shelterType"),
      shelterId: get("shelterId"),
      breedId: get("breedId"),
      mixed: get("mixed"),
      size: get("size"),
      sex: get("sex"),
      age: get("age"),
      withDogs: get("withDogs"),
      withCats: get("withCats"),
      withKids: get("withKids"),
      urgent: get("urgent"),
      specialNeeds: get("specialNeeds"),
      hasPhoto: get("hasPhoto"),
    };
  }, [sp, species]);

  useEffect(() => {
    const cur = sp.get("species");
    if (cur) return;

    const params = new URLSearchParams(sp.toString());
    params.set("species", "dog");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setOptionsLoading(true);
      setErrorMsg("");
      setAdoptionTableMissing(false);

      const breedsReq = supabase
        .from(BREEDS_TABLE)
        .select("id,name")
        .eq("species", species)
        .order("name", { ascending: true });

      const sheltersReq = supabase
        .from(SHELTERS_TABLE)
        .select("id,name,type,city")
        .order("name", { ascending: true });

      const citiesReq = supabase
        .from(ADOPTION_TABLE)
        .select("city")
        .eq("species", species)
        .eq("status", "available")
        .not("city", "is", null);

      const [breedsRes, sheltersRes, citiesRes] = await Promise.all([
        breedsReq,
        sheltersReq,
        citiesReq,
      ]);

      if (!mounted) return;

      if (breedsRes.error) {
        const msg = breedsRes.error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setBreeds([]);
        } else {
          setErrorMsg(breedsRes.error.message);
        }
      } else {
        setBreeds((breedsRes.data ?? []).map((b: BreedRow) => ({ id: b.id, name: b.name })));
      }

      if (sheltersRes.error) {
        const msg = sheltersRes.error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setShelters([]);
        } else {
          setErrorMsg((prev) => prev || sheltersRes.error.message);
          setShelters([]);
        }
      } else {
        setShelters(
          (sheltersRes.data ?? []).map((s: ShelterRow) => ({
            id: s.id,
            name: s.name,
            type: s.type as ShelterType,
            city: s.city ?? null,
          }))
        );
      }

      if (citiesRes.error) {
        const msg = citiesRes.error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setCities([]);
          setAdoptionTableMissing(true);
        } else {
          setErrorMsg((prev) => prev || citiesRes.error.message);
          setCities([]);
        }
      } else {
        const rows = (citiesRes.data ?? []) as CityRow[];
        const uniqueCities = Array.from(
          new Set(rows.map((r) => str(r.city)).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, "it"));
        setCities(uniqueCities);
      }

      setOptionsLoading(false);
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [species]);

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      setResultsLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from(ADOPTION_TABLE)
        .select("*")
        .eq("species", species)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        const msg = error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setAdoptionTableMissing(true);
          setAnimals([]);
        } else {
          setErrorMsg(error.message);
          setAnimals([]);
        }
      } else {
        setAnimals((data ?? []) as AnimalRow[]);
      }

      setResultsLoading(false);
    }

    loadResults();

    return () => {
      mounted = false;
    };
  }, [species]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal: AnimalRow) => {
      if (filters.city && readAnimalCity(animal) !== filters.city) return false;
      if (filters.shelterType && readAnimalShelterType(animal) !== filters.shelterType) return false;
      if (filters.shelterId && readAnimalShelterId(animal) !== filters.shelterId) return false;
      if (filters.breedId && readAnimalBreedId(animal) !== filters.breedId) return false;

      if (filters.mixed === "true" && !readAnimalMixed(animal)) return false;
      if (filters.mixed === "false" && readAnimalMixed(animal)) return false;

      if (filters.size && readAnimalSize(animal) !== filters.size) return false;
      if (filters.sex && readAnimalSex(animal) !== filters.sex) return false;

      if (filters.age && !ageRangeMatches(readAnimalAgeMonths(animal), filters.age)) return false;

      if (filters.withDogs === "true" && !readAnimalWithDogs(animal)) return false;
      if (filters.withCats === "true" && !readAnimalWithCats(animal)) return false;
      if (filters.withKids === "true" && !readAnimalWithKids(animal)) return false;
      if (filters.urgent === "true" && !readAnimalUrgent(animal)) return false;
      if (filters.specialNeeds === "true" && !readAnimalSpecialNeeds(animal)) return false;
      if (filters.hasPhoto === "true" && !readAnimalHasPhoto(animal)) return false;

      return true;
    });
  }, [animals, filters]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Adozioni UNIMALIA</h2>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-900">Area riservata alle associazioni</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Le adozioni su UNIMALIA sono pensate per le associazioni e non per i privati.
              L’obiettivo è pubblicare animali adottabili in modo più ordinato, con filtri di
              ricerca chiari e una base digitale già pronta.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-900">Continuità dopo l’adozione</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              L’associazione può creare gratuitamente l’identità animale completa. Se il nuovo
              proprietario decide di continuare a usare UNIMALIA in versione Premium entro 15 giorni
              dal passaggio di proprietà, il primo anno da 6 euro viene riconosciuto all’associazione.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">Ricerca con filtri</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">
            Dentro l’area adozioni è possibile cercare gli animali tramite filtri per specie,
            città, struttura, razza, taglia, sesso, età e altre caratteristiche utili.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/professionisti/login"
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Accesso associazioni
          </Link>

          <Link
            href="/identita"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Scopri identità animale
          </Link>
        </div>
      </section>

      {adoptionTableMissing ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-900">
            Sezione adozioni non ancora collegata al database
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            La pagina è pronta, ma nel database Supabase non risulta ancora disponibile la tabella{" "}
            <b>{ADOPTION_TABLE}</b>. Appena la colleghi, gli annunci compariranno qui.
          </p>
        </div>
      ) : null}

      {optionsLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-700">Caricamento filtri…</p>
        </div>
      ) : (
        <AdottaFilters
          species={species}
          breeds={breeds}
          shelters={shelters}
          cities={cities}
          isPending={isPending}
        />
      )}

      <AdottaResults
        animals={filteredAnimals}
        loading={resultsLoading}
        errorMessage={errorMsg}
      />
    </div>
  );
}