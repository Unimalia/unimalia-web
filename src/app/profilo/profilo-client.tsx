// app/profilo/profilo-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  fiscal_code: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  city: string | null;
};

function buildFullName(first: string, last: string) {
  const f = (first || "").trim();
  const l = (last || "").trim();
  return f && l ? `${f} ${l}` : `${f} ${l}`.trim();
}

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function normalizePhone(input: string) {
  const raw = (input || "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  // se non parte con + assumiamo Italia (+39)
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function isLikelyFullName(first: string, last: string) {
  const f = (first || "").trim();
  const l = (last || "").trim();
  // minimo sobrio: entrambi presenti e lunghi almeno 2
  return f.length >= 2 && l.length >= 2;
}

export function ProfiloClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const returnTo = useMemo(() => sp.get("returnTo") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const phoneE164 = useMemo(() => normalizePhone(phone), [phone]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionErr || !sessionData.session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const u = sessionData.session.user;
      setUser({ id: u.id, email: u.email ?? null });

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, fiscal_code, phone, phone_verified, city")
        .eq("id", u.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) {
        setErrorMsg(profErr.message);
        setLoading(false);
        return;
      }

      const row = (prof ?? null) as ProfileRow | null;

      // Preferiamo first/last, altrimenti deriviamo da full_name
      const dbFirst = String(row?.first_name ?? "").trim();
      const dbLast = String(row?.last_name ?? "").trim();
      const dbFull = String(row?.full_name ?? "").trim();

      if (dbFirst || dbLast) {
        setFirstName(dbFirst);
        setLastName(dbLast);
      } else if (dbFull) {
        const parts = dbFull.split(/\s+/).filter(Boolean);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName("");
        setLastName("");
      }

      setFiscalCode(String(row?.fiscal_code ?? "").trim());
      setPhone(String(row?.phone ?? "").trim());
      setCity(String(row?.city ?? "").trim());
      setPhoneVerified(Boolean(row?.phone_verified));

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendPhoneOtp() {
    setErrorMsg("");
    setSuccessMsg("");

    if (!user?.id) return;
    if (!phoneE164) {
      setErrorMsg("Inserisci un numero di telefono valido.");
      return;
    }

    setSaving(true);
    try {
      // avvia verifica telefono (SMS)
      const { error } = await supabase.auth.updateUser({ phone: phoneE164 });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setOtpSent(true);
      setSuccessMsg("Codice inviato via SMS ✅ Inseriscilo per verificare il telefono.");
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante l’invio del codice SMS.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyPhoneOtp() {
    setErrorMsg("");
    setSuccessMsg("");

    if (!user?.id) return;
    const token = (otp || "").trim();
    if (!token) {
      setErrorMsg("Inserisci il codice ricevuto via SMS.");
      return;
    }
    if (!phoneE164) {
      setErrorMsg("Telefono non valido.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token,
        type: "phone_change",
      });

      if (error) {
        setErrorMsg("Codice non valido o scaduto. Riprova.");
        return;
      }

      // segna verificato su profiles
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ phone: phoneE164, phone_verified: true })
        .eq("id", user.id);

      if (upErr) {
        setErrorMsg(upErr.message);
        return;
      }

      setPhoneVerified(true);
      setOtpSent(false);
      setOtp("");
      setSuccessMsg("Telefono verificato ✅");
    } catch (err: any) {
      setErrorMsg(err?.message || "Errore durante la verifica del telefono.");
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    if (!user?.id) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const first = firstName.trim();
    const last = lastName.trim();
    const full = buildFullName(first, last);

    // validazioni richieste
    if (!isLikelyFullName(first, last)) {
      setErrorMsg("Inserisci nome e cognome (reali).");
      setSaving(false);
      return;
    }

    const cityV = city.trim();
    if (cityV.length < 2) {
      setErrorMsg("Inserisci la città.");
      setSaving(false);
      return;
    }

    const cf = normalizeCF(fiscalCode);
    if (cf && cf.length !== 16) {
      setErrorMsg("Il codice fiscale deve avere 16 caratteri (oppure lascialo vuoto).");
      setSaving(false);
      return;
    }

    // telefono obbligatorio
    if (!phoneE164) {
      setErrorMsg("Inserisci un numero di telefono valido.");
      setSaving(false);
      return;
    }

    const payload: Partial<ProfileRow> = {
      first_name: first || null,
      last_name: last || null,
      full_name: full || null,
      fiscal_code: cf || null, // facoltativo
      phone: phoneE164 || null,
      city: cityV || null,
      // phone_verified NON lo tocchiamo qui: lo gestisce verify OTP
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setSuccessMsg("Salvato ✅");
    setSaving(false);

    // se telefono non verificato, guida l’utente a farlo
    if (!phoneVerified) {
      setSuccessMsg("Dati salvati ✅ Ora verifica il telefono via SMS.");
      return;
    }

    if (returnTo) {
      startTransition(() => router.replace(returnTo));
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Devi effettuare l’accesso per vedere il profilo.</p>
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-900">Email</p>
        <p className="text-sm text-zinc-700">{user.email ?? "—"}</p>
        <p className="mt-2 text-xs text-zinc-600">
          Per la convalida dell’identità digitale da parte del veterinario, è necessario inserire{" "}
          <span className="font-medium">nome e cognome reali</span>. In caso contrario la convalida potrebbe non essere accettata.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-900">Nome</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Nome"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-900">Cognome</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Cognome"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Telefono</label>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              // se cambia il telefono, la verifica torna falsa finché non rifatta
              setPhoneVerified(false);
              setOtpSent(false);
              setOtp("");
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Es. +393331112222 (o 3331112222)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`text-xs ${
                phoneVerified ? "text-emerald-700" : "text-zinc-600"
              }`}
            >
              {phoneVerified ? "Telefono verificato ✅" : "Telefono non verificato"}
            </span>

            {!phoneVerified ? (
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={saving || !phoneE164}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                Invia codice SMS
              </button>
            ) : null}
          </div>

          {!phoneVerified && otpSent ? (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
              <label className="text-sm font-medium text-zinc-900">Codice SMS</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
                  placeholder="Inserisci il codice"
                />
                <button
                  type="button"
                  onClick={verifyPhoneOtp}
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  Verifica
                </button>
              </div>
            </div>
          ) : null}

          <p className="mt-1 text-xs text-zinc-500">
            Obbligatorio. La verifica via SMS serve a garantire contatti affidabili.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Città</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Es. Firenze"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">
            Codice fiscale <span className="text-zinc-500">(facoltativo)</span>
          </label>
          <input
            value={fiscalCode}
            onChange={(e) => setFiscalCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="16 caratteri"
          />
        </div>
      </div>

      {errorMsg ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}

      {successMsg ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMsg} {isPending ? "…" : ""}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggio…" : "Salva"}
        </button>

        <Link
          href="/profilo/abbonamento"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          Abbonamento
        </Link>

        {returnTo ? (
          <Link
            href={returnTo}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Torna indietro
          </Link>
        ) : null}
      </div>
    </div>
  );
}