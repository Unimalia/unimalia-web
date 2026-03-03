"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function normalizePhone(input: string) {
  const raw = (input || "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  // Se non parte con +, assumiamo Italia (+39). Se vuoi, lo rendiamo più rigido dopo.
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function isLikelyFullName(s: string) {
  const v = (s || "").trim();
  // minimo sobrio: 2 parole e almeno 5 caratteri totali
  if (v.length < 5) return false;
  const parts = v.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

function isProfileComplete(p: any) {
  if (!p) return false;

  const fullNameOk = isLikelyFullName(p.full_name ?? "");
  const phoneOk = normalizePhone(p.phone ?? "").length >= 8;
  const cityOk = (p.city ?? "").trim().length >= 2;

  const cf = normalizeCF(p.fiscal_code ?? "");
  const cfOk = !cf || cf.length === 16; // facoltativo

  const phoneVerified = p.phone_verified === true; // richiede colonna boolean in profiles
  return fullNameOk && phoneOk && cityOk && cfOk && phoneVerified;
}

async function ensureProfileRow(userId: string) {
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });
}

async function decideRedirect(router: ReturnType<typeof useRouter>, fallback: string) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  await ensureProfileRow(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,fiscal_code,phone,phone_verified,city")
    .eq("id", user.id)
    .single();

  if (!isProfileComplete(profile)) {
    router.replace("/profilo");
  } else {
    router.replace(fallback);
  }
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/identita";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // campi profilo (richiesti in signup; in login li usiamo solo se mancano e vuoi completarli qui)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  // verifica telefono
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const phoneE164 = useMemo(() => normalizePhone(phone), [phone]);

  // Se già loggato, non restare su /login
  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (data.user) {
        await decideRedirect(router, next);
        return;
      }

      setLoadingPage(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        await decideRedirect(router, next);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  async function sendPhoneOtp() {
    setMsg(null);

    if (!phoneE164) return setMsg("Inserisci un numero di telefono valido.");
    setSubmitting(true);

    try {
      // Invia OTP per associare/verificare il telefono dell’utente loggato
      const { error } = await supabase.auth.updateUser({ phone: phoneE164 });
      if (error) {
        setMsg(error.message);
        return;
      }
      setOtpSent(true);
      setMsg("Codice inviato via SMS ✅ Inseriscilo qui sotto per verificare il telefono.");
    } catch (err: any) {
      const message =
        err?.message ||
        (typeof err === "string" ? err : "") ||
        (navigator.onLine ? "Errore di rete." : "Sei offline.");
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyPhoneOtp() {
    setMsg(null);

    const token = (otp || "").trim();
    if (!token) return setMsg("Inserisci il codice ricevuto via SMS.");
    if (!phoneE164) return setMsg("Telefono non valido.");

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token,
        type: "phone_change",
      });

      if (error) {
        setMsg("Codice non valido o scaduto. Riprova.");
        return;
      }

      // aggiorna profilo: phone + flag verificato
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (user) {
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, phone: phoneE164, phone_verified: true },
            { onConflict: "id" }
          );
      }

      setMsg("Telefono verificato ✅");
      await decideRedirect(router, next);
    } catch (err: any) {
      const message =
        err?.message ||
        (typeof err === "string" ? err : "") ||
        (navigator.onLine ? "Errore di rete." : "Sei offline.");
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const e1 = email.trim();
    if (!e1) return setMsg("Inserisci email.");
    if (!password || password.length < 6)
      return setMsg("Inserisci una password (min 6 caratteri).");

    if (mode === "signup") {
      if (!isLikelyFullName(fullName))
        return setMsg("Inserisci nome e cognome (reali).");
      if (!phoneE164) return setMsg("Inserisci un numero di telefono valido.");
      if ((city || "").trim().length < 2) return setMsg("Inserisci la città.");

      const cf = normalizeCF(fiscalCode);
      if (cf && cf.length !== 16)
        return setMsg("Il codice fiscale deve avere 16 caratteri (oppure lascialo vuoto).");
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const cf = normalizeCF(fiscalCode);

        const { error } = await supabase.auth.signUp({
          email: e1,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phoneE164,
              city: city.trim(),
              fiscal_code: cf || null,
            },
          },
        });

        if (error) {
          setMsg(error.message);
          return;
        }

        // se email confirmation è attiva, l’utente potrebbe non avere sessione subito
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          setMsg(
            "Registrazione completata ✅ Controlla l’email per confermare l’account. Dopo la conferma, accedi e completa la verifica del telefono."
          );
          return;
        }

        // crea/aggiorna profilo con i dati appena inseriti
        await ensureProfileRow(data.user.id);
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phoneE164,
            city: city.trim(),
            fiscal_code: cf || null,
            phone_verified: false,
          },
          { onConflict: "id" }
        );

        // invia OTP SMS e fai verificare subito
        await sendPhoneOtp();
        setMsg("Registrazione ok ✅ Ora verifica il telefono con il codice SMS.");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: e1,
          password,
        });

        if (error) {
          setMsg("Credenziali non valide. Controlla email e password.");
          return;
        }

        await decideRedirect(router, next);
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      const message =
        err?.message ||
        (typeof err === "string" ? err : "") ||
        (navigator.onLine
          ? "Errore di rete (fetch). Controlla URL Supabase / AdBlock."
          : "Sei offline. Controlla internet.");
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setMsg(null);

    const e1 = email.trim();
    if (!e1)
      return setMsg("Scrivi prima la tua email, poi clicca “Password dimenticata”.");

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e1);
      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Ok ✅ Se l’email è corretta, riceverai un link per reimpostare la password.");
    } catch (err: any) {
      console.error("RESET ERROR:", err);
      const message =
        err?.message ||
        (typeof err === "string" ? err : "") ||
        (navigator.onLine ? "Errore di rete (fetch)." : "Sei offline. Controlla internet.");
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Login</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-md">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === "login" ? "Accedi" : "Crea account"}
        </h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">
        Per pubblicare uno smarrimento e creare l’identità animale serve un account.
        <br />
        <span className="text-zinc-600">
          Ti chiediamo nome e cognome reali: in caso contrario il veterinario potrebbe non convalidare l’identità digitale.
        </span>
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "login"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium">Nome e cognome</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Telefono (verifica SMS)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Es. +393331112222 (o 3331112222)"
                  required
                />
                <p className="mt-1 text-xs text-zinc-600">
                  Se non inserisci il prefisso, assumiamo +39.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">Città</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es. Firenze"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Codice fiscale <span className="text-zinc-500">(facoltativo)</span>
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value)}
                  placeholder="16 caratteri"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuo@email.it"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              required
            />
          </div>

          {msg && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              {msg}
            </div>
          )}

          {/* Step verifica telefono (dopo signup) */}
          {mode === "signup" && otpSent && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <label className="block text-sm font-medium">Codice SMS</label>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Inserisci il codice"
                />
                <button
                  type="button"
                  onClick={verifyPhoneOtp}
                  disabled={submitting}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
                >
                  Verifica
                </button>
              </div>

              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={submitting}
                className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Reinvio codice SMS
              </button>
            </div>
          )}

          <button
            disabled={submitting}
            className="w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Attendi..." : mode === "login" ? "Accedi" : "Crea account"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full rounded-lg border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              disabled={submitting}
            >
              Password dimenticata
            </button>
          )}
        </form>
      </div>
    </main>
  );
}