"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  full_name: string | null;
  fiscal_code: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  cap: string | null;
  created_at?: string | null;
};

function onlyLettersSpaces(s: string) {
  return s.replace(/[^a-zA-ZÀ-ÿ\s'’.-]/g, "");
}

function normalizeCF(s: string) {
  return s.replace(/\s+/g, "").trim().toUpperCase();
}

function normalizeCAP(s: string) {
  return s.replace(/\D+/g, "").slice(0, 5);
}

function normalizeProvince(s: string) {
  return s.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

function isCFValidBasic(cf: string) {
  // validazione "soft": 16 caratteri alfanumerici
  return /^[A-Z0-9]{16}$/.test(cf);
}

export default function ProfiloPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [cap, setCap] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  const requiredOk = useMemo(() => {
    const fn = fullName.trim();
    const cf = normalizeCF(fiscalCode);
    const a = address.trim();
    const c = city.trim();
    const p = normalizeProvince(province);
    const z = normalizeCAP(cap);

    return (
      fn.length >= 3 &&
      a.length >= 5 &&
      c.length >= 2 &&
      p.length === 2 &&
      z.length === 5 &&
      isCFValidBasic(cf)
    );
  }, [fullName, fiscalCode, address, city, province, cap]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setMsg(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // assicura riga profilo
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,fiscal_code,address,city,province,cap,created_at")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setMsg("Errore nel caricamento del profilo. Riprova.");
        setProfile(null);
        setLoading(false);
        return;
      }

      const p = data as ProfileRow;
      setProfile(p);

      setFullName(p.full_name ?? "");
      setFiscalCode(p.fiscal_code ?? "");
      setAddress(p.address ?? "");
      setCity(p.city ?? "");
      setProvince(p.province ?? "");
      setCap(p.cap ?? "");

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  async function save() {
    setMsg(null);

    const fn = fullName.trim();
    const cf = normalizeCF(fiscalCode);
    const a = address.trim();
    const c = city.trim();
    const p = normalizeProvince(province);
    const z = normalizeCAP(cap);

    if (fn.length < 3) return setMsg("Inserisci Nome e Cognome (minimo 3 caratteri).");
    if (!isCFValidBasic(cf)) return setMsg("Inserisci un Codice Fiscale valido (16 caratteri).");
    if (a.length < 5) return setMsg("Inserisci un indirizzo valido.");
    if (c.length < 2) return setMsg("Inserisci la città.");
    if (p.length !== 2) return setMsg("Inserisci la provincia (es. FI, MI, RM).");
    if (z.length !== 5) return setMsg("Inserisci un CAP valido (5 numeri).");

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fn,
          fiscal_code: cf,
          address: a,
          city: c,
          province: p,
          cap: z,
        })
        .eq("id", user.id);

      if (error) throw error;

      setMsg("Profilo salvato ✅");
    } catch (e: any) {
      setMsg(e?.message || "Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Il mio profilo</h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">
        Questi dati servono per rendere affidabile l’identità digitale dell’animale e per la gestione dei professionisti.
      </p>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Caricamento…</p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome e cognome *</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(onlyLettersSpaces(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Es. Mario Rossi"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Codice fiscale *</span>
              <input
                value={fiscalCode}
                onChange={(e) => setFiscalCode(normalizeCF(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2 font-mono"
                placeholder="Es. RSSMRA80A01H501U"
                maxLength={16}
              />
              <span className="text-xs text-zinc-500">16 caratteri. Per ora validazione base (formato).</span>
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Indirizzo *</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Es. Via Roma 10"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Città *</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Es. Firenze"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Provincia *</span>
              <input
                value={province}
                onChange={(e) => setProvince(normalizeProvince(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2 uppercase"
                placeholder="Es. FI"
                maxLength={2}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">CAP *</span>
              <input
                value={cap}
                onChange={(e) => setCap(normalizeCAP(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Es. 50123"
                maxLength={5}
              />
            </label>
          </div>

          {msg && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              {msg}
            </div>
          )}

          {!requiredOk && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Completa tutti i campi obbligatori per poter usare tutte le funzioni (es. creare profili animali).
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Salvataggio…" : "Salva profilo"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
