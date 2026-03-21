"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
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
  const cityOk = (p.city ?? "").trim().length >= 2;

  const cf = normalizeCF(p.fiscal_code ?? "");
  const cfOk = !cf || cf.length === 16;

  return fullNameOk && cityOk && cfOk;
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
    .select("full_name,fiscal_code,city")
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
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const emailFromUrl = (searchParams.get("email") || "").trim().toLowerCase();
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail((prev) => (prev ? prev : emailFromUrl));
    }
  }, [emailFromUrl]);

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
            emailRedirectTo: "https://unimalia.it/auth/confirm",
            data: {
              full_name: fullName.trim(),
              city: city.trim(),
              fiscal_code: cf || null,
            },
          },
        });

        if (error) {
          const m = (error.message || "").toLowerCase();

          if (
            m.includes("already registered") ||
            m.includes("already exists") ||
            m.includes("user already registered")
          ) {
            setMsg(
              "Questa email risulta già registrata. Usa “Accedi” oppure “Password dimenticata”."
            );
            setMode("login");
            return;
          }

          setMsg(error.message);
          return;
        }

        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          setMsg(
            "Registrazione quasi completata ✅ Controlla la tua email e clicca il link di conferma. Ti riporteremo su UNIMALIA per completare l’accesso."
          );
          setMode("login");
          return;
        }

        await ensureProfileRow(data.user.id);
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            full_name: fullName.trim(),
            city: city.trim(),
            fiscal_code: cf || null,
          },
          { onConflict: "id" }
        );

        await decideRedirect(router, next);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("confirm") || m.includes("confirmed") || m.includes("not confirmed")) {
          setMsg(
            "Email non confermata. Controlla la tua casella di posta e clicca il link di conferma."
          );
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
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: "https://unimalia.it/login",
      });

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
        Gli smarrimenti su UNIMALIA sono sempre gratuiti e puoi pubblicarli anche senza
        registrazione.
        <br />
        <span className="text-zinc-600">
          Creare un account ti permette di gestire l’identità animale e accedere alle funzioni
          complete della piattaforma. Il telefono non è richiesto in questa fase: verrà gestito più
          avanti solo per funzioni premium e notifiche dedicate.
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
                <label htmlFor="full-name" className="block text-sm font-medium">
                  Nome e cognome
                </label>
                <input
                  id="full-name"
                  name="name"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium">
                  Città
                </label>
                <input
                  id="city"
                  name="city"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es. Firenze"
                  autoComplete="address-level2"
                  required
                />
              </div>

              <div>
                <label htmlFor="fiscal-code" className="block text-sm font-medium">
                  Codice fiscale <span className="text-zinc-500">(facoltativo)</span>
                </label>
                <input
                  id="fiscal-code"
                  name="fiscal-code"
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
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
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
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
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
                Usa almeno 12 caratteri con maiuscola, minuscola, numero e simbolo. Il browser o il
                telefono possono proporti una password casuale sicura.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium">
                Conferma password
              </label>
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