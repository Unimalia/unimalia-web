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

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#edf2f7] bg-[#fbfdff] px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d91]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#30486f]">{value}</div>
    </div>
  );
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
      <SectionCard>
        <p className="text-sm text-[#5f708a]">Caricamento abbonamento…</p>
      </SectionCard>
    );
  }

  if (!sessionUser) {
    return (
      <SectionCard>
        <p className="text-sm text-[#5f708a]">Devi effettuare l’accesso per vedere l’abbonamento.</p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
          >
            Accedi
          </Link>

          <Link
            href="/profilo"
            className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
          >
            Torna al profilo
          </Link>
        </div>
      </SectionCard>
    );
  }

  const sub = data?.subscription ?? null;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
              Area personale
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
              Abbonamento
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#5f708a] sm:text-base">
              Stato del piano associato al tuo account UNIMALIA e dati principali della
              sottoscrizione.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] px-4 py-4 sm:min-w-[260px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
              Email account
            </p>
            <p className="mt-2 text-sm font-semibold text-[#30486f]">
              {sessionUser.email ?? "—"}
            </p>
          </div>
        </div>
      </SectionCard>

      {errorMsg ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <SectionCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#30486f]">Stato abbonamento</h2>
            <p className="mt-1 text-sm text-[#5f708a]">
              Riepilogo del piano e dello stato attuale del tuo account.
            </p>
          </div>

          <Link
            href="/profilo"
            className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
          >
            ← Profilo
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Stato" value={statusLabel(sub?.status)} />
          <InfoTile label="Premium attivo" value={data?.premium ? "Sì" : "No"} />
          <InfoTile label="Ruolo piano" value={fmt(sub?.role)} />
          <InfoTile label="Intervallo" value={fmt(sub?.billing_interval)} />
        </div>
      </SectionCard>

      <SectionCard>
        <div>
          <h2 className="text-lg font-semibold text-[#30486f]">Dettagli tecnici</h2>
          <p className="mt-1 text-sm text-[#5f708a]">
            Informazioni Stripe e stato della sottoscrizione, utili per controllo e supporto.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Stripe customer" value={fmt(sub?.stripe_customer_id)} />
          <InfoTile label="Stripe subscription" value={fmt(sub?.stripe_subscription_id)} />
          <InfoTile label="current_period_end" value={fmt(sub?.current_period_end)} />
          <InfoTile label="trial_end" value={fmt(sub?.trial_end)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] opacity-60"
            title="Lo attiviamo al prossimo step (Customer Portal)"
          >
            Gestisci abbonamento (Portal)
          </button>
        </div>

        <p className="mt-4 text-xs leading-6 text-[#6f7d91]">
          Nota: current_period_end è ancora null finché non lo salviamo via webhook o sync nei
          passaggi successivi.
        </p>
      </SectionCard>
    </div>
  );
}