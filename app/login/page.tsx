"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function isProfileComplete(p: any) {
  if (!p) return false;
  return (
    (p.full_name ?? "").trim().length >= 3 &&
    normalizeCF(p.fiscal_code ?? "").length === 16 &&
    (p.address ?? "").trim().length >= 5 &&
    (p.city ?? "").trim().length >= 2 &&
    (p.province ?? "").trim().length === 2 &&
    (p.cap ?? "").trim().length === 5
  );
}

async function decideRedirect(router: ReturnType<typeof useRouter>, fallback = "/identita") {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  // assicura riga profiles (se non esiste ancora)
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  // leggi dati profilo per decidere redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,fiscal_code,address,city,province,cap")
    .eq("id", user.id)
    .single();

  if (!isProfileComplete(profile)) {
    router.replace("/profilo");
  } else {
    router.replace(fallback);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // se in futuro vuoi gestire un redirect custom:
  // /login?next=/smarrimenti/nuovo
  const next = searchParams.get("next") || "/identita";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Se già loggato, via da /login
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);
      setMsg(null);

      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (data.user) {
        await decideRedirect(router, next);
        return;
      }

      setLoading(false);
    }

    init();

    // opzionale: se cambia sessione (login/logout), reagisci
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const e1 = email.trim();
    if (!e1) return setMsg("Inserisci email.");
    if (!password) return setMsg("Inserisci password.");

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: e1,
        password,
      });

      if (error) {
        setMsg("Credenziali non valide. Controlla email e password.");
        return;
      }

      // ✅ redirect “intelligente”
      await decideRedirect(router, next);
    } catch {
      setMsg("Errore di connessione. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
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
        <h1 className="text-3xl font-bold tracking-tight">Login</h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@email.it"
            autoComplete="email"
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
          />
        </label>

        {msg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

        <p className="mt-4 text-center text-sm text-zinc-600">
          Non hai un account?{" "}
          <Link className="font-medium text-zinc-900 hover:underline" href="/registrati">
            Registrati
          </Link>
        </p>
      </form>
    </main>
  );
}
