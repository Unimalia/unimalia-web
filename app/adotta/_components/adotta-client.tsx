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

function getSpecies(sp: URLSearchParams): Species {
  const s = (sp.get("species") || "").toLowerCase();
  if (s === "cat" || s === "other") return s;
  return "dog";
}

function truthyParam(v: string | null) {
  if (!v) return undefined;
  return v === "1" || v === "true";
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

  const [profileDebug, setProfileDebug] = useState<any>(null);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [breeds, setBreeds] = useState<BreedOpt[]>([]);
  const [shelters, setShelters] = useState<ShelterOpt[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [resultsLoading, setResultsLoading] = useState(true);
  const [animals, setAnimals] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

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

      if (sessionUser.email && fullName && phone) {
        setProfileOk(true);
      } else {
        setProfileOk(false);
      }

      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, sessionUser?.email]);

  /* ===========================
     LOAD FILTER OPTIONS (SAFE)
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      if (!sessionUser?.id || !profileOk) return;

      setOptionsLoading(true);
      setErrorMsg("");

      const breedsReq = supabase
        .from("breeds")
        .select("id,name")
        .eq("species", species)
        .order("name", { ascending: true });

      const sheltersReq = supabase
        .from("shelters")
        .select("id,name,type,city")
        .order("name", { ascending: true });

      const citiesReq = supabase
        .from("adoption_animals")
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

      /* BREEDS */
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

      /* SHELTERS */
      if (sheltersRes.error) {
        setShelters([]);
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

      /* CITIES */
      if (citiesRes.error) {
        setCities([]);
      } else {
        const rows = (citiesRes.data ?? []) as CityRow[];
        const uniqueCities = Array.from(
          new Set(rows.map((r) => String(r.city ?? "").trim()).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, "it"));

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
     RESULTS
  ============================ */

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      if (!sessionUser?.id || !profileOk) return;

      setResultsLoading(true);
      setErrorMsg("");

      let q = supabase
        .from("adoption_animals")
        .select("*")
        .eq("species", species)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      const { data, error } = await q;

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setAnimals([]);
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
    return <div className="rounded-2xl border p-4 shadow-sm">Caricamento…</div>;
  }

  if (!sessionUser) {
    return (
      <div className="rounded-2xl border p-6 shadow-sm">
        <p>Devi effettuare l’accesso.</p>
        <Link href="/login" className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-white">
          Accedi
        </Link>
      </div>
    );
  }

  if (profileLoading) {
    return <div className="rounded-2xl border p-4 shadow-sm">Verifica profilo…</div>;
  }

  if (!profileOk) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm">
        <p className="font-medium">Completa il profilo per continuare</p>
        <p className="mt-2">
          Servono: <b>email</b>, <b>nome e cognome</b> e <b>telefono</b>.
        </p>

        {profileDebug && (
          <div className="mt-3 text-xs opacity-70">
            <div>full_name="{profileDebug.fullName}"</div>
            <div>phone="{profileDebug.phone}"</div>
            <div>profilesRowFound: {String(profileDebug.profilesRowFound)}</div>
          </div>
        )}

        <Link
          href="/profilo?returnTo=/adotta"
          className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-white"
        >
          Vai al profilo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {optionsLoading ? (
        <div className="rounded-2xl border p-4 shadow-sm">Caricamento filtri…</div>
      ) : (
        <AdottaFilters species={species} breeds={breeds} shelters={shelters} cities={cities} isPending={isPending} />
      )}

      <AdottaResults animals={animals} loading={resultsLoading} errorMessage={errorMsg} />
    </div>
  );
}