// app/adotta/_components/adotta-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// IMPORT RELATIVO (così non dipendi da alias @/ o tsconfig paths)
import { supabase } from "../../../lib/supabaseClient";

import { AdottaFilters } from "./adotta-filters";
import { AdottaResults } from "./adotta-results";

type Species = "dog" | "cat" | "other";
type ShelterType = "canile" | "gattile" | "rifugio";

type BreedOpt = { id: string; name: string };
type ShelterOpt = { id: string; name: string; type: ShelterType; city: string | null };

type CityRow = { city: string | null };

function getSpecies(sp: URLSearchParams): Species {
  const s = (sp.get("species") || "").toLowerCase();
  if (s === "cat" || s === "other") return s;
  return "dog";
}

function truthyParam(v: string | null) {
  if (!v) return undefined;
  return v === "1" || v === "true";
}

function readFirstName(row: any) {
  return String(row?.first_name ?? row?.nome ?? row?.name ?? row?.firstName ?? "").trim();
}
function readLastName(row: any) {
  return String(row?.last_name ?? row?.cognome ?? row?.surname ?? row?.lastName ?? "").trim();
}
function readPhone(row: any) {
  return String(row?.phone ?? row?.telefono ?? row?.phone_number ?? row?.phoneNumber ?? "").trim();
}

export function AdottaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const species = useMemo(() => getSpecies(sp), [sp]);

  // --- Auth / Profile gate ---
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string | null } | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileOk, setProfileOk] = useState(false);
  const [profileDebug, setProfileDebug] = useState<{ first: string; last: string; phone: string } | null>(null);

  // --- Options + results ---
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [breeds, setBreeds] = useState<BreedOpt[]>([]);
  const [shelters, setShelters] = useState<ShelterOpt[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [resultsLoading, setResultsLoading] = useState(true);
  const [animals, setAnimals] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 1) Session
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        setSessionUser(null);
        setAuthLoading(false);
        return;
      }

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

  // 2) Profile completeness
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!sessionUser?.id) {
        setProfileOk(false);
        setProfileDebug(null);
        return;
      }

      setProfileLoading(true);
      setProfileOk(false);
      setProfileDebug(null);

      const { data, error } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle();

      if (!mounted) return;

      if (error) {
        setProfileOk(false);
        setProfileLoading(false);
        return;
      }

      const first = readFirstName(data);
      const last = readLastName(data);
      const phone = readPhone(data);

      setProfileDebug({ first, last, phone });
      setProfileOk(Boolean(sessionUser.email && first && last && phone));
      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, sessionUser?.email]);

  // 3) Ensure species param always present
  useEffect(() => {
    const cur = sp.get("species");
    if (cur) return;

    const params = new URLSearchParams(sp.toString());
    params.set("species", "dog");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Load options
  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      if (!sessionUser?.id || !profileOk) return;

      setOptionsLoading(true);
      setErrorMsg("");

      const [
        { data: breedsData, error: breedsErr },
        { data: sheltersData, error: sheltersErr },
        { data: cityRows, error: cityErr },
      ] = await Promise.all([
        supabase.from("breeds").select("id,name").eq("species", species).order("name", { ascending: true }),
        supabase.from("shelters").select("id,name,type,city").order("name", { ascending: true }),
        supabase
          .from("adoption_animals")
          .select("city")
          .eq("species", species)
          .eq("status", "available")
          .not("city", "is", null),
      ]);

      if (!mounted) return;

      if (breedsErr || sheltersErr || cityErr) {
        setErrorMsg(breedsErr?.message || sheltersErr?.message || cityErr?.message || "Errore nel caricamento filtri");
        setOptionsLoading(false);
        return;
      }

      setBreeds((breedsData ?? []).map((b: any) => ({ id: b.id, name: b.name })));

      setShelters(
        (sheltersData ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type as ShelterType,
          city: (s.city ?? null) as string | null,
        })),
      );

      const rows = (cityRows ?? []) as CityRow[];
      const uniqueCities: string[] = Array.from(
        new Set(rows.map((r) => String(r.city ?? "").trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "it"));

      setCities(uniqueCities);
      setOptionsLoading(false);
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, profileOk, species]);

  // 5) Load results
  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      if (!sessionUser?.id || !profileOk) return;

      setResultsLoading(true);
      setErrorMsg("");

      const city = (sp.get("city") || "").trim();
      const shelterType = (sp.get("shelterType") || "").trim();
      const shelterId = (sp.get("shelterId") || "").trim();
      const breedId = (sp.get("breedId") || "").trim();
      const mixed = truthyParam(sp.get("mixed"));
      const size = (sp.get("size") || "").trim();
      const sex = (sp.get("sex") || "").trim();
      const age = (sp.get("age") || "").trim();
      const withDogs = truthyParam(sp.get("withDogs"));
      const withCats = truthyParam(sp.get("withCats"));
      const withKids = truthyParam(sp.get("withKids"));
      const urgent = truthyParam(sp.get("urgent"));
      const specialNeeds = truthyParam(sp.get("specialNeeds"));
      const hasPhoto = truthyParam(sp.get("hasPhoto"));

      let q = supabase
        .from("adoption_animals")
        .select(
          `
          id,
          name,
          species,
          city,
          province,
          age_months,
          sex,
          size,
          is_mixed,
          photo_url,
          urgent,
          shelters:shelter_id ( id, name, type, city )
        `,
        )
        .eq("species", species)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (city) q = q.eq("city", city);
      if (shelterType) q = q.eq("shelter_type", shelterType);
      if (shelterId) q = q.eq("shelter_id", shelterId);
      if (breedId) q = q.eq("breed_id", breedId);
      if (mixed !== undefined) q = q.eq("is_mixed", mixed);
      if (size) q = q.eq("size", size);
      if (sex) q = q.eq("sex", sex);

      if (age) {
        if (age === "0-2") q = q.gte("age_months", 0).lte("age_months", 24);
        if (age === "3-6") q = q.gte("age_months", 36).lte("age_months", 72);
        if (age === "7+") q = q.gte("age_months", 84);
      }

      if (withDogs !== undefined) q = q.eq("good_with_dogs", withDogs);
      if (withCats !== undefined) q = q.eq("good_with_cats", withCats);
      if (withKids !== undefined) q = q.eq("good_with_kids", withKids);
      if (urgent !== undefined) q = q.eq("urgent", urgent);
      if (specialNeeds !== undefined) q = q.eq("special_needs", specialNeeds);
      if (hasPhoto) q = q.not("photo_url", "is", null);

      const { data, error } = await q;

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setAnimals([]);
        setResultsLoading(false);
        return;
      }

      setAnimals(data ?? []);
      setResultsLoading(false);
    }

    loadResults();

    return () => {
      mounted = false;
    };
  }, [sessionUser?.id, profileOk, species, sp]);

  // --- UI states ---
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
        <p className="text-sm text-zinc-700">Per vedere gli annunci di adozione devi effettuare l’accesso.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Accedi
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Torna alla home
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
          Per accedere alle adozioni servono: <b>email</b>, <b>nome</b>, <b>cognome</b> e <b>telefono</b>.
        </p>
        {profileDebug ? (
          <p className="mt-3 text-xs text-amber-900/70">
            Debug: nome="{profileDebug.first}", cognome="{profileDebug.last}", telefono="{profileDebug.phone}"
          </p>
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