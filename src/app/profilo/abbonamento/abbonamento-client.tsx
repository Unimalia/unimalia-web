// app/profilo/abbonamento/abbonamento-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type BillingStatusResponse = {
  user_id: string;
  premium: boolean;
  subscription: null | {
    user_id: string;
    status: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    role: string | null;
    billing_interval: string | null;
    current_period_end: string | null;
    trial_end: string | null;
    last_webhook_event_id: string | null;
  };
  error?: string;
};

function fmt(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

function statusLabel(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  if (!s) return "Nessun abbonamento";
  if (s === "active") return "Attivo ✅";
  if (s === "trialing") return "In prova ✅";
  if (s === "past_due") return "Pagamento in ritardo ⚠️";
  if (s === "canceled") return "Cancellato";
  if (s === "unpaid") return "Non pagato ⚠️";
  return s;
}

export function AbbonamentoClient() {
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string | null } | null>(null);
  const [data, setData] = useState<BillingStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");
      setData(null);

      const { data: s } = await supabase.auth.getSession();
      const u = s.session?.user;

      if (!mounted) return;

      if (!u || !s.session?.access_token) {
        setSessionUser(null);
        setLoading(false);
        return;
      }

      setSessionUser({ id: u.id, email: u.email ?? null });

      const res = await fetch("/api/billing/status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${s.session.access_token}`,
        },
        cache: "no-store",
      });

      const json = (await res.json()) as BillingStatusResponse;

      if (!mounted) return;

      if (!res.ok) {
        setErrorMsg(json?.error ?? "Errore nel recupero stato abbonamento.");
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento abbonamento…</p>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Devi effettuare l’accesso per vedere l’abbonamento.</p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Accedi
          </Link>
          <Link
            href="/profilo"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Torna al profilo
          </Link>
        </div>
      </div>
    );
  }

  const sub = data?.subscription ?? null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Abbonamento</h1>
          <p className="mt-1 text-sm text-zinc-600">Stato e piano associati al tuo account.</p>
        </div>

        <Link
          href="/profilo"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          ← Profilo
        </Link>
      </div>

      {errorMsg ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Stato</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{statusLabel(sub?.status)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Premium: <span className="font-medium text-zinc-900">{data?.premium ? "Sì" : "No"}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Piano</p>
          <p className="mt-1 text-sm text-zinc-900">
            Ruolo: <span className="font-medium">{fmt(sub?.role)}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-900">
            Intervallo: <span className="font-medium">{fmt(sub?.billing_interval)}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Dettagli tecnici</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <p className="text-sm text-zinc-900">
              Stripe customer: <span className="font-medium">{fmt(sub?.stripe_customer_id)}</span>
            </p>
            <p className="text-sm text-zinc-900">
              Stripe subscription: <span className="font-medium">{fmt(sub?.stripe_subscription_id)}</span>
            </p>
            <p className="text-sm text-zinc-900">
              current_period_end: <span className="font-medium">{fmt(sub?.current_period_end)}</span>
            </p>
            <p className="text-sm text-zinc-900">
              trial_end: <span className="font-medium">{fmt(sub?.trial_end)}</span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* Lo attiviamo nello STEP 3 (Customer Portal) */}
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm opacity-60"
              title="Lo attiviamo al prossimo step (Customer Portal)"
            >
              Gestisci abbonamento (Portal)
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: current_period_end è ancora null finché non lo salviamo via webhook/sync (step successivi).
          </p>
        </div>
      </div>
    </div>
  );
}