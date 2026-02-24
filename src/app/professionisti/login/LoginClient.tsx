"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoadingPage(true);

      const m = sp.get("msg");
      if (m === "accesso_non_autorizzato") {
        setMsg("Accesso non autorizzato: questo account non è abilitato al portale professionisti.");
      }

      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (data.user) {
        // se già loggato, controlla se è abilitato
        const { data: row } = await supabase
          .from("professionals_users")
          .select("active")
          .eq("user_id", data.user.id)
          .single();

        if (row?.active) {
          router.replace("/professionisti");
          return;
        }

        await supabase.auth.signOut();
      }

      setLoadingPage(false);
    }

    init();
    return () => {
      alive = false;
    };
  }, [router, sp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const e1 = email.trim();
    if (!e1) return setMsg("Inserisci email.");
    if (!password || password.length < 6) return setMsg("Inserisci una password (min 6 caratteri).");

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: e1, password });
      if (error) {
        setMsg("Credenziali non valide. Controlla email e password.");
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setMsg("Errore login. Riprova.");
        return;
      }

      const { data: row } = await supabase
        .from("professionals_users")
        .select("active")
        .eq("user_id", user.id)
        .single();

      if (!row?.active) {
        await supabase.auth.signOut();
        setMsg("Questo account non è abilitato al portale professionisti.");
        return;
      }

      router.replace("/professionisti");
    } catch (err: any) {
      console.error("PRO LOGIN ERROR:", err);
      setMsg(err?.message || "Errore di rete. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Portale Professionisti</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portale Professionisti</h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Sito pubblico
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">Accesso riservato ai professionisti abilitati.</p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="email@studio.it"
          />
        </label>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        {msg && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Accesso…" : "Accedi"}
        </button>
      </form>
    </main>
  );
}
