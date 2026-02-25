"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function isProfessionalEmail(email?: string | null) {
  const e = String(email || "").toLowerCase();
  const allow = new Set([
    "valentinotwister@hotmail.it",
    // aggiungi qui altre email professionisti
  ]);
  return allow.has(e);
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/professionisti";

  const [email, setEmail] = useState("valentinotwister@hotmail.it");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setErr(error.message || "Errore login.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    // ✅ PASSAPARTOUT: stessa allowlist del ProShell
    if (!user || !isProfessionalEmail(user.email)) {
      await supabase.auth.signOut();
      setLoading(false);
      setErr("Questo account non è abilitato al portale professionisti.");
      return;
    }

    setLoading(false);
    router.replace(next);
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
            Accesso riservato ai professionisti abilitati.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                autoComplete="current-password"
              />
            </div>

            {err ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {err}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Accesso…" : "Accedi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}