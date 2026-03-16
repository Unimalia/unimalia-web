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
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function isLikelyFullName(s: string) {
  const v = (s || "").trim();
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
  const cfOk = !cf || cf.length === 16;

  const phoneVerified =
    p.phone_verified === undefined ? true : p.phone_verified === true;

  return fullNameOk && phoneOk && cityOk && cfOk && phoneVerified;
}

function sanitizeNextPath(value: string | null) {
  if (!value) return "/identita";
  if (!value.startsWith("/")) return "/identita";
  if (value.startsWith("//")) return "/identita";
  return value;
}

function getPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < 12) issues.push("almeno 12 caratteri");
  if (!/[a-z]/.test(password)) issues.push("almeno una lettera minuscola");
  if (!/[A-Z]/.test(password)) issues.push("almeno una lettera maiuscola");
  if (!/[0-9]/.test(password)) issues.push("almeno un numero");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("almeno un simbolo");

  return issues;
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
    router.replace(`/profilo?returnTo=${encodeURIComponent(fallback)}`);
  } else {
    router.replace(fallback);
  }
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = sanitizeNextPath(searchParams.get("next"));
  const onboardingPhone = searchParams.get("onboarding") === "phone";

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const phoneE164 = useMemo(() => normalizePhone(phone), [phone]);
  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      const signedIn = !!data.user;
      setHasSession(signedIn);

      if (signedIn && !onboardingPhone) {
        await decideRedirect(router, next);
        return;
      }

      if (signedIn && onboardingPhone) {
        setMode("signup");
        setMsg(
          "Email confermata ✅ Ora verifica il telefono per completare l’attivazione del profilo."
        );
      }

      setLoadingPage(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const signedIn = !!session?.user;
      setHasSession(signedIn);

      if (event === "SIGNED_IN" && !onboardingPhone) {
        await decideRedirect(router, next);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, next, onboardingPhone]);

  async function sendPhoneOtp() {
    setMsg(null);

    if (!phoneE164) {
      setMsg("Inserisci un numero di telefono valido.");
      return;
    }

    setSubmitting(true);

    try {
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
    if (!token) {
      setMsg("Inserisci il codice ricevuto via SMS.");
      return;
    }

    if (!phoneE164) {
      setMsg("Telefono non valido.");
      return;
    }

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

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            phone: phoneE164,
            phone_verified: true,
          },
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

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setMsg("Inserisci email.");
      return;
    }

    if (mode === "login") {
      if (!password) {
        setMsg("Inserisci la password.");
        return;
      }
    }

    if (mode === "signup") {
      if (!isLikelyFullName(fullName)) {
        setMsg("Inserisci nome e cognome reali.");
        return;
      }

      if (!phoneE164) {
        setMsg("Inserisci un numero di telefono valido.");
        return;
      }

      if ((city || "").trim().length < 2) {
        setMsg("Inserisci la città.");
        return;
      }

      const cf = normalizeCF(fiscalCode);
      if (cf && cf.length !== 16) {
        setMsg("Il codice fiscale deve avere 16 caratteri oppure va lasciato vuoto.");
        return;
      }

      if (passwordIssues.length > 0) {
        setMsg(`Password non valida: ${passwordIssues.join(", ")}.`);
        return;
      }

      if (password !== confirmPassword) {
        setMsg("Le due password non coincidono.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const cf = normalizeCF(fiscalCode);

        const { error } = await supabase.auth.signUp({
          email: emailValue,
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

        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          setMsg(
            "Registrazione quasi completata ✅ Controlla la tua email e clicca il link di conferma. Ti riporteremo su UNIMALIA per completare l’attivazione."
          );
          setMode("login");
          return;
        }

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

        await sendPhoneOtp();
        setMsg("Registrazione completata ✅ Ora verifica il telefono con il codice SMS.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("confirm") || m.includes("confirmed") || m.includes("not confirmed")) {
          setMsg("Email non confermata. Controlla la tua casella di posta e clicca il link di conferma.");
          return;
        }

        setMsg("Credenziali non valide. Controlla email e password.");
        return;
      }

      await decideRedirect(router, next);
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

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setMsg("Scrivi prima la tua email, poi clicca “Password dimenticata”.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue);
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

  if (onboardingPhone && hasSession) {
    return (
      <main className="max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Attiva il profilo</h1>
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Home
          </Link>
        </div>

        <p className="mt-3 text-zinc-700">
          La tua email è stata confermata. Ora verifichiamo il numero di telefono per completare
          l’attivazione del profilo UNIMALIA.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium">Telefono</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Es. +393331112222"
              autoComplete="tel"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Se non inserisci il prefisso, assumiamo +39.
            </p>
          </div>

          <button
            type="button"
            onClick={sendPhoneOtp}
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "Attendi..." : "Invia codice SMS"}
          </button>

          {otpSent && (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
              <label className="block text-sm font-medium">Codice SMS</label>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Inserisci il codice"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
            </div>
          )}

          {msg && (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              {msg}
            </div>
          )}
        </div>
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

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800 shadow-sm">
        Sei un professionista?
        <Link
          href="/professionisti/login"
          className="ml-2 font-semibold text-zinc-900 underline underline-offset-2"
        >
          Vai al Portale Professionisti
        </Link>
      </div>

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

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium">Nome e cognome</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Telefono (verifica SMS)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Es. +393331112222 o 3331112222"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
                <p className="mt-1 text-xs text-zinc-600">Se non inserisci il prefisso, assumiamo +39.</p>
              </div>

              <div>
                <label className="block text-sm font-medium">Città</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es. Firenze"
                  autoComplete="address-level2"
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
                  autoComplete="off"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuo@email.it"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              name={mode === "signup" ? "new-password" : "password"}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Minimo 12 caratteri" : "La tua password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              autoCapitalize="none"
              spellCheck={false}
              minLength={mode === "signup" ? 12 : undefined}
              required
            />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-zinc-600">
                Usa almeno 12 caratteri con maiuscola, minuscola, numero e simbolo. Il browser o il telefono
                possono proporti una password casuale sicura.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium">Conferma password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                minLength={12}
                required
              />
            </div>
          )}

          {mode === "signup" && password.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              <p className="font-medium">Requisiti password</p>
              <ul className="mt-2 space-y-1">
                <li>{password.length >= 12 ? "✅" : "•"} Almeno 12 caratteri</li>
                <li>{/[a-z]/.test(password) ? "✅" : "•"} Almeno una minuscola</li>
                <li>{/[A-Z]/.test(password) ? "✅" : "•"} Almeno una maiuscola</li>
                <li>{/[0-9]/.test(password) ? "✅" : "•"} Almeno un numero</li>
                <li>{/[^A-Za-z0-9]/.test(password) ? "✅" : "•"} Almeno un simbolo</li>
              </ul>
            </div>
          )}

          {msg && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
              {msg}
            </div>
          )}

          {mode === "signup" && otpSent && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <label className="block text-sm font-medium">Codice SMS</label>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Inserisci il codice"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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