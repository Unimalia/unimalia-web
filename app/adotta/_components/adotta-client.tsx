"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

import { AdottaFilters } from "./adotta-filters";
import { AdottaResults } from "./adotta-results";

type Species = "dog" | "cat" | "other";
type ShelterType = "canile" | "gattile" | "rifugio";

type BreedOpt = { id: string; name: string };
type ShelterOpt = { id: string; name: string; type: ShelterType; city: string | null };
type CityRow = { city: string | null };
type DbRow = Record<string, any>;

const ADOPTION_TABLE = "adoption_animals"; // ✅ se in futuro la tabella si chiama diversamente, cambi qui
const BREEDS_TABLE = "breeds";
const SHELTERS_TABLE = "shelters";

function getSpecies(sp: URLSearchParams): Species {
  const s = (sp.get("species") || "").toLowerCase();
  if (s === "cat" || s === "other") return s;
  return "dog";
}

export function AdottaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const species = useMemo(() => getSpecies(sp), [sp]);

  const [authLoading, setAuthLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string | null } | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileOk, setProfileOk] = useState(false);

  const [profileDebug, setProfileDebug] = useState<{
    fullName: string;
    phone: string;
    profilesRowFound: boolean;
    profilesError: string;
    profilesKeys: string;
  } | null>(null);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [breeds, setBreeds] = useState<BreedOpt[]>([]);
  const [shelters, setShelters] = useState<ShelterOpt[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [resultsLoading, setResultsLoading] = useState(true);
  const [animals, setAnimals] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [adoptionTableMissing, setAdoptionTableMissing] = useState(false);

  /* ===========================
     SESSION
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setAuthLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const u = data.session?.user;
      setSessionUser(u ? { id: u.id, email: u.email ?? null } : null);
      setAuthLoading(false);
    }

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const u = session?.user;
        setSessionUser(u ? { id: u.id, email: u.email ?? null } : null);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ===========================
     PROFILE GATE
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!sessionUser?.id) {
        setProfileOk(false);
        setProfileDebug(null);
        return;
      }

      setProfileLoading(true);

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!mounted) return;

      const row = (prof ?? null) as DbRow | null;

      const fullName = String(row?.full_name ?? "").trim();
      const phone = String(row?.phone ?? "").trim();

      setProfileDebug({
        fullName,
        phone,
        profilesRowFound: Boolean(row),
        profilesError: error?.message || "",
        profilesKeys: row ? Object.keys(row).join(", ") : "",
      });

      setProfileOk(Boolean(sessionUser.email && fullName && phone));
      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, sessionUser?.email]);

  /* ===========================
     ENSURE species param exists
  ============================ */
  useEffect(() => {
    const cur = sp.get("species");
    if (cur) return;

    const params = new URLSearchParams(sp.toString());
    params.set("species", "dog");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     LOAD FILTER OPTIONS (SAFE)
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      if (!sessionUser?.id || !profileOk) return;

      setOptionsLoading(true);
      setErrorMsg("");
      setAdoptionTableMissing(false);

      // breeds opzionale
      const breedsReq = supabase
        .from(BREEDS_TABLE)
        .select("id,name")
        .eq("species", species)
        .order("name", { ascending: true });

      // shelters opzionale
      const sheltersReq = supabase
        .from(SHELTERS_TABLE)
        .select("id,name,type,city")
        .order("name", { ascending: true });

      // cities da adoption table (ma può mancare)
      const citiesReq = supabase
        .from(ADOPTION_TABLE)
        .select("city")
        .eq("species", species)
        .eq("status", "available")
        .not("city", "is", null);

      const [breedsRes, sheltersRes, citiesRes] = await Promise.all([breedsReq, sheltersReq, citiesReq]);

      if (!mounted) return;

      // BREEDS
      if (breedsRes.error) {
        const msg = breedsRes.error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setBreeds([]);
        } else {
          setErrorMsg(breedsRes.error.message);
        }
      } else {
        setBreeds((breedsRes.data ?? []).map((b: any) => ({ id: b.id, name: b.name })));
      }

      // SHELTERS
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
          (sheltersRes.data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            type: s.type as ShelterType,
            city: s.city ?? null,
          })),
        );
      }

      // CITIES (adoption_animals può mancare)
      if (citiesRes.error) {
        const msg = citiesRes.error.message || "";
        if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
          setCities([]);
          setAdoptionTableMissing(true);
          // non è un errore “bloccante”: la sezione non è ancora configurata
        } else {
          setErrorMsg((prev) => prev || citiesRes.error.message);
          setCities([]);
        }
      } else {
        const rows = (citiesRes.data ?? []) as CityRow[];
        const uniqueCities = Array.from(new Set(rows.map((r) => String(r.city ?? "").trim()).filter(Boolean))).sort(
          (a, b) => a.localeCompare(b, "it"),
        );
        setCities(uniqueCities);
      }

      setOptionsLoading(false);
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, profileOk, species]);

  /* ===========================
     RESULTS (SAFE)
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      if (!sessionUser?.id || !profileOk) return;

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
        setAnimals(data ?? []);
      }

      setResultsLoading(false);
    }

    loadResults();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, profileOk, species]);

  /* ===========================
     UI STATES
  ============================ */

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Per vedere le adozioni devi effettuare l’accesso.</p>
        <div className="mt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Verifica profilo…</p>
      </div>
    );
  }

  if (!profileOk) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">Completa il profilo per continuare</p>
        <p className="mt-2 text-amber-900/80">
          Servono: <b>email</b>, <b>nome e cognome</b> e <b>telefono</b>.
        </p>

        {profileDebug ? (
          <div className="mt-3 space-y-1 text-xs text-amber-900/70">
            <div>full_name="{profileDebug.fullName}"</div>
            <div>phone="{profileDebug.phone}"</div>
            <div>profilesRowFound: {String(profileDebug.profilesRowFound)}</div>
          </div>
        ) : null}

        <div className="mt-4">
          <Link
            href="/profilo?returnTo=/adotta"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Vai al profilo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {adoptionTableMissing ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-900">Sezione “Adotta” non ancora configurata</p>
          <p className="mt-2 text-sm text-zinc-700">
            Nel database Supabase non esiste la tabella <b>{ADOPTION_TABLE}</b>.
            <br />
            La pagina è pronta: appena crei la tabella (o mi dici il nome reale), colleghiamo tutto e compaiono gli
            annunci.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Suggerimento: in Supabase vai su <b>Table Editor</b> e cerca se esiste una tabella tipo{" "}
            <b>adoptions</b>, <b>adoption_listings</b>, <b>animals_for_adoption</b>, ecc.
          </p>
        </div>
      ) : null}

      {optionsLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-700">Caricamento filtri…</p>
        </div>
      ) : (
        <AdottaFilters species={species} breeds={breeds} shelters={shelters} cities={cities} isPending={isPending} />
      )}

      <AdottaResults animals={animals} loading={resultsLoading} errorMessage={errorMsg} />
    </div>
  );
}