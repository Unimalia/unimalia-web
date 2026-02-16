"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

function province2(s: string) {
  return (s || "").trim().toUpperCase().slice(0, 2);
}

export default function ProfiloPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [email, setEmail] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [cap, setCap] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setMsg(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login?next=/profilo");
        return;
      }

      setEmail(user.email ?? "");

      // assicura la riga
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const { data: p, error } = await supabase
        .from("profiles")
        .select("full_name,fiscal_code,address,city,province,cap")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error) {
        setMsg("Errore nel caricamento del profilo. Riprova.");
        setLoading(false);
        return;
      }

      setFullName((p?.full_name ?? "").toString());
      setFiscalCode((p?.fiscal_code ?? "").toString());
      setAddress((p?.address ?? "").toString());
      setCity((p?.city ?? "").toString());
      setProvince((p?.province ?? "").toString());
      setCap((p?.cap ?? "").toString());

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  function validate() {
    const fn = fullName.trim();
    const cf = normalizeCF(fiscalCode);
    const addr = address.trim();
    const c = city.trim();
    const prov = province2(province);
    const pcap = onlyDigits(cap);

    if (fn.length < 3) return "Inserisci nome e cognome.";
    if (cf.length !== 16) return "Codice fiscale non valido (deve essere di 16 caratteri).";
    if (addr.length < 5) return "Inserisci un indirizzo valido.";
    if (c.length < 2) return "Inserisci la città.";
    if (prov.length !== 2) return "Provincia non valida (2 lettere, es. FI).";
    if (pcap.length !== 5) return "CAP non valido (5 cifre).";

    return null;
  }

  async function save() {
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace("/login?next=/profilo");
        return;
      }

      const payload = {
        id: user.id,
        full_name: fullName.trim(),
        fiscal_code: normalizeCF(fiscalCode),
        address: address.trim(),
        city: city.trim(),
        province: province2(province),
        cap: onlyDigits(cap),
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      setMsg("Profilo aggiornato ✅");
      router.replace("/identita");
    } catch {
      setMsg("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo proprietario</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profilo proprietario</h1>
        <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
          ← Torna
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">Completa i dati per usare UNIMALIA in modo completo.</p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Email: <span className="font-medium text-zinc-900">{email || "—"}</span>
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Nome e cognome *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Codice fiscale *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 uppercase"
              value={fiscalCode}
              onChange={(e) => setFiscalCode(e.target.value)}
              placeholder="16 caratteri"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Indirizzo *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via / Piazza, numero"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Città *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Provincia *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 uppercase"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Es. FI"
              maxLength={2}
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">CAP *</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="5 cifre"
              inputMode="numeric"
            />
          </label>
        </div>

        {msg && (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
            {msg}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>
    </main>
  );
}
