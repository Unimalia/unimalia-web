"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNextPath(next: string | null | undefined) {
  const n = String(next || "").trim();

  if (!n) return "/professionisti/dashboard";
  if (!n.startsWith("/professionisti")) return "/professionisti/dashboard";
  if (n.startsWith("/professionisti/login")) return "/professionisti/dashboard";

  return n;
}

function getPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < 12) issues.push("almeno 12 caratteri");
  if (!/[a-z]/.test(password)) issues.push("almeno una minuscola");
  if (!/[A-Z]/.test(password)) issues.push("almeno una maiuscola");
  if (!/[0-9]/.test(password)) issues.push("almeno un numero");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("almeno un simbolo");

  return issues;
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNextPath(sp.get("next"));
  const initialMode = sp.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [professionalType, setProfessionalType] = useState<"generic" | "veterinarian">("generic");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  const canSubmit = useMemo(() => {
    if (mode === "login") {
      return email.trim().length > 3 && password.length >= 1;
    }

    return email.trim().length > 3 && password.length >= 12 && confirmPassword.length >= 12;
  }, [email, password, confirmPassword, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (passwordIssues.length > 0) {
          setErr(`Password non valida: ${passwordIssues.join(", ")}.`);
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErr("Le due password non coincidono.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: "https://unimalia.it/auth/confirm?next=%2Fprofessionisti%2Fdashboard",
            data: {
              is_professional: true,
              professional_type: professionalType,
              is_veterinarian: professionalType === "veterinarian",
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
            setErr("Questa email risulta già registrata. Usa “Accedi” oppure “Password dimenticata”.");
            setMode("login");
            setLoading(false);
            return;
          }

          setErr(error.message || "Errore registrazione.");
          setLoading(false);
          return;
        }

        setLoading(false);
        setMsg(
          professionalType === "veterinarian"
            ? "Registrazione veterinario completata ✅ Controlla l’email per confermare l’account. Dopo la conferma potrai accedere al Portale Professionisti; l’abilitazione finale resterà soggetta a verifica."
            : "Registrazione professionista completata ✅ Controlla l’email per confermare l’account. Dopo la conferma potrai accedere al Portale Professionisti."
        );
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();

        if (m.includes("confirm") || m.includes("confirmed") || m.includes("not confirmed")) {
          setErr("Email non confermata. Controlla la tua casella di posta e clicca il link di conferma.");
          setLoading(false);
          return;
        }

        setErr(error.message || "Errore login.");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const isProfessional =
        !!user &&
        Boolean(user.app_metadata?.is_professional || user.user_metadata?.is_professional);

      if (!isProfessional) {
        await supabase.auth.signOut();
        setLoading(false);
        setErr("Questo account non è abilitato al Portale Professionisti.");
        return;
      }

      setLoading(false);
      router.replace(next);
    } catch (e: any) {
      setLoading(false);
      setErr(e?.message || "Errore inatteso.");
    }
  }

  async function handleResetPassword() {
    setErr(null);
    setMsg(null);

    const e1 = email.trim().toLowerCase();
    if (!e1) {
      setErr("Scrivi prima la tua email.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e1, {
        redirectTo: "https://unimalia.it/professionisti/login",
      });

      if (error) {
        setErr(error.message || "Errore invio reset password.");
        setLoading(false);
        return;
      }

      setMsg("Se l’email esiste, riceverai un link per reimpostare la password.");
    } catch (e: any) {
      setErr(e?.message || "Errore inatteso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="mb-4">
          <Link href="/" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
            ← Sito pubblico
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Portale Professionisti</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Accesso e registrazione dedicati ai professionisti.
          </p>

          <div className="mt-6 mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErr(null);
                setMsg(null);
              }}
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
              onClick={() => {
                setMode("signup");
                setErr(null);
                setMsg(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "signup"
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-zinc-700">Tipo di registrazione</label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setProfessionalType("generic")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left ${
                      professionalType === "generic"
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    Professionista
                    <div className="mt-1 text-xs font-normal opacity-90">
                      Toelettatura, pensione, educatore, pet sitter, altri servizi.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfessionalType("veterinarian")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left ${
                      professionalType === "veterinarian"
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    Veterinario
                    <div className="mt-1 text-xs font-normal opacity-90">
                      Accesso veterinario con verifica e abilitazioni dedicate.
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="pro-email" className="text-xs font-semibold text-zinc-700">Email</label>
              <input
                id="pro-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                type="email"
                inputMode="email"
              />
            </div>

            <div>
              <label htmlFor="pro-password" className="text-xs font-semibold text-zinc-700">Password</label>
              <input
                id="pro-password"
                name={mode === "login" ? "password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                autoCapitalize="none"
                spellCheck={false}
                minLength={mode === "signup" ? 12 : undefined}
              />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="pro-confirm-password" className="text-xs font-semibold text-zinc-700">
                    Conferma password
                  </label>
                  <input
                    id="pro-confirm-password"
                    name="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={12}
                  />
                </div>

                {password.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
                    <p className="font-semibold">Requisiti password</p>
                    <ul className="mt-2 space-y-1">
                      <li>{password.length >= 12 ? "✅" : "•"} Almeno 12 caratteri</li>
                      <li>{/[a-z]/.test(password) ? "✅" : "•"} Almeno una minuscola</li>
                      <li>{/[A-Z]/.test(password) ? "✅" : "•"} Almeno una maiuscola</li>
                      <li>{/[0-9]/.test(password) ? "✅" : "•"} Almeno un numero</li>
                      <li>{/[^A-Za-z0-9]/.test(password) ? "✅" : "•"} Almeno un simbolo</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            {err ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {err}
              </div>
            ) : null}

            {msg ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {msg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? mode === "login"
                  ? "Accesso…"
                  : "Registrazione…"
                : mode === "login"
                  ? "Accedi"
                  : professionalType === "veterinarian"
                    ? "Registrati come veterinario"
                    : "Registrati come professionista"}
            </button>

            {mode === "login" ? (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
              >
                Password dimenticata
              </button>
            ) : null}

            <div className="text-xs text-zinc-500">
              Dopo l’accesso verrai reindirizzato a:{" "}
              <span className="font-semibold text-zinc-700">{next}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}