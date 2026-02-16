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

async function decideRedirect(router: ReturnType<typeof useRouter>, fallback: string) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  // assicura riga profiles
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

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
  const next = searchParams.get("next") || "/identita";

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ se già loggato, non restare su /login
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoadingPage(true);
      setMsg(null);

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

    const e1 = email.trim();
    if (!e1) return setMsg("Inserisci email.");
    if (!password || password.length < 6) return setMsg("Inserisci una password (min 6 caratteri).");

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: e1, password });
        if (error) {
          setMsg("Registrazione non riuscita. Controlla i dati e riprova.");
          return;
        }

        // se richiede conferma email, potresti non essere loggato subito
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setMsg("Registrazione ok ✅ Controlla la tua email per confermare l’account, poi fai login.");
          return;
        }

        await decideRedirect(router, next);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: e1, password });
        if (error) {
          setMsg("Credenziali non valide. Controlla email e password.");
          return;
        }

        await decideRedirect(router, next);
      }
    } catch {
      setMsg("Errore di connessione. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setMsg(null);

    const e1 = email.trim();
    if (!e1) return setMsg("Scrivi prima la tua email, poi clicca “Password dimenticata”.");

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e1);
      if (error) {
        setMsg("Errore nel reset password. Riprova.");
        return;
      }
      setMsg("Ok ✅ Se l’email è corretta, riceverai un link per reimpostare la password.");
    } catch {
      setMsg("Errore di connessione. Riprova.");
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
        <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? "Accedi" : "Crea account"}</h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">
        Per pubblicare uno smarrimento e creare l’identità animale serve un account.
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
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuo@email.it"
              autoComplete="email"
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

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
