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

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNextPath(sp.get("next"));
  const initialMode = sp.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6,
    [email, password]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              is_professional: true,
            },
          },
        });

        if (error) {
          setErr(error.message || "Errore registrazione.");
          setLoading(false);
          return;
        }

        setLoading(false);
        setMsg(
          "Registrazione completata. Se la conferma email è attiva, controlla la posta e poi accedi al Portale Professionisti."
        );
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message || "Errore login.");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user || !user.user_metadata?.is_professional) {
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

    const e1 = email.trim();
    if (!e1) {
      setErr("Scrivi prima la tua email.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e1);
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

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete="email"
                type="email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

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