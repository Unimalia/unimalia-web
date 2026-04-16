"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  fiscal_code: string | null;
  phone: string | null;
  city: string | null;
};

function buildFullName(first: string, last: string) {
  return `${first}`.trim() && `${last}`.trim()
    ? `${first.trim()} ${last.trim()}`
    : `${first} ${last}`.trim();
}

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
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

function Field({
  label,
  children,
  hint,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#30486f]">{label}</label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-xs leading-6 text-[#6f7d91]">{hint}</p> : null}
    </div>
  );
}

export function ProfiloClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const returnTo = useMemo(() => sp.get("returnTo") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [softDeleting, setSoftDeleting] = useState(false);
  const [hardDeleting, setHardDeleting] = useState(false);

  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteErrorMsg, setDeleteErrorMsg] = useState("");
  const [showSoftDeleteConfirm, setShowSoftDeleteConfirm] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionErr || !sessionData.session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const u = sessionData.session.user;
      setUser({ id: u.id, email: u.email ?? null });

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, fiscal_code, phone, city")
        .eq("id", u.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) {
        setErrorMsg(profErr.message);
        setLoading(false);
        return;
      }

      const row = (prof ?? null) as ProfileRow | null;

      const dbFirst = String(row?.first_name ?? "").trim();
      const dbLast = String(row?.last_name ?? "").trim();
      const dbFull = String(row?.full_name ?? "").trim();

      if (dbFirst || dbLast) {
        setFirstName(dbFirst);
        setLastName(dbLast);
      } else if (dbFull) {
        const parts = dbFull.split(/\s+/).filter(Boolean);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName("");
        setLastName("");
      }

      setFiscalCode(String(row?.fiscal_code ?? "").trim());
      setPhone(String(row?.phone ?? "").trim());
      setCity(String(row?.city ?? "").trim());

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSave() {
    if (!user?.id) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const first = firstName.trim();
    const last = lastName.trim();
    const full = buildFullName(first, last);

    const cf = normalizeCF(fiscalCode.trim());
    if (cf && cf.length !== 16) {
      setErrorMsg("Il codice fiscale deve avere 16 caratteri oppure va lasciato vuoto.");
      setSaving(false);
      return;
    }

    const payload: Partial<ProfileRow> = {
      first_name: first || null,
      last_name: last || null,
      full_name: full || null,
      fiscal_code: cf || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setSuccessMsg("Salvato ✅");
    setSaving(false);

    if (returnTo) {
      startTransition(() => router.replace(returnTo));
    }
  }

  async function onDeactivateAccount() {
    setSoftDeleting(true);
    setDeleteErrorMsg("");
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/profile/deactivate", {
        method: "POST",
        cache: "no-store",
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !json?.ok) {
        setDeleteErrorMsg(json?.error || "Errore durante la disattivazione account.");
        setSoftDeleting(false);
        return;
      }

      await supabase.auth.signOut();

      router.replace("/login?account=disattivato");
      router.refresh();
    } catch {
      setDeleteErrorMsg("Errore di rete durante la disattivazione account.");
      setSoftDeleting(false);
    }
  }

  async function onDeleteAccountPermanently() {
    setHardDeleting(true);
    setDeleteErrorMsg("");
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        cache: "no-store",
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !json?.ok) {
        setDeleteErrorMsg(json?.error || "Errore durante l’eliminazione definitiva account.");
        setHardDeleting(false);
        return;
      }

      await supabase.auth.signOut();

      router.replace("/login?account=eliminato");
      router.refresh();
    } catch {
      setDeleteErrorMsg("Errore di rete durante l’eliminazione definitiva account.");
      setHardDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6">
        <p className="text-sm text-[#5f708a]">Caricamento…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_10px_28px_rgba(42,56,86,0.05)]">
        <p className="text-sm text-[#5f708a]">Devi effettuare l’accesso per vedere il profilo.</p>

        <div className="mt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
          >
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
              Area personale
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
              Il tuo profilo
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#5f708a] sm:text-base">
              Gestisci i tuoi dati principali, l’accesso all’account e le impostazioni collegate al
              tuo profilo UNIMALIA.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] px-4 py-4 sm:min-w-[260px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
              Email account
            </p>
            <p className="mt-2 text-sm font-semibold text-[#30486f]">{user.email ?? "—"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#30486f]">Dati profilo</h2>
            <p className="mt-1 text-sm text-[#5f708a]">
              Queste informazioni vengono usate per completare il tuo profilo e abilitare alcuni
              flussi della piattaforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/profilo/abbonamento"
              className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
            >
              Abbonamento
            </Link>

            {returnTo ? (
              <Link
                href={returnTo}
                className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Torna indietro
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
              placeholder="Nome"
            />
          </Field>

          <Field label="Cognome">
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
              placeholder="Cognome"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Città" hint="Obbligatorio per creare un’identità animale.">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
                placeholder="Es. Firenze"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Telefono" hint="Obbligatorio per contatti in adozione.">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
                placeholder="Telefono"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={<><span>Codice fiscale </span><span className="text-[#6f7d91]">(facoltativo)</span></>}>
              <input
                value={fiscalCode}
                onChange={(e) => setFiscalCode(e.target.value)}
                className="w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
                placeholder="16 caratteri"
              />
            </Field>
          </div>
        </div>

        {errorMsg ? (
          <div className="mt-5 rounded-[1.1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mt-5 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMsg} {isPending ? "…" : ""}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </SectionCard>

      <SectionCard className="border-red-200 bg-red-50">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-red-900">Disattiva account</h2>
          <p className="text-sm leading-7 text-red-800">
            Il tuo account verrà archiviato e l’accesso sarà bloccato. I dati resteranno
            conservati per un eventuale recupero successivo.
          </p>
        </div>

        {deleteErrorMsg ? (
          <div className="mt-4 rounded-[1.1rem] border border-red-300 bg-white p-4 text-sm text-red-700">
            {deleteErrorMsg}
          </div>
        ) : null}

        {!showSoftDeleteConfirm ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setShowSoftDeleteConfirm(true);
                setShowHardDeleteConfirm(false);
                setDeleteErrorMsg("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Disattiva il mio account
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-red-300 bg-white p-4">
            <p className="text-sm font-semibold text-red-900">
              Confermi di voler disattivare il tuo account?
            </p>
            <p className="mt-2 text-sm leading-7 text-red-800">
              Dopo la conferma verrai disconnesso. L’account resterà archiviato e potrà essere
              recuperato in seguito.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDeactivateAccount}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {softDeleting ? "Disattivazione…" : "Conferma disattivazione"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSoftDeleteConfirm(false);
                  setDeleteErrorMsg("");
                }}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard className="border-rose-300 bg-rose-50">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-rose-900">
            Elimina definitivamente account
          </h2>
          <p className="text-sm leading-7 text-rose-800">
            Questa operazione è irreversibile. I dati personali del tuo account e dell’eventuale
            profilo professionale collegato verranno anonimizzati.
          </p>
        </div>

        {!showHardDeleteConfirm ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setShowHardDeleteConfirm(true);
                setShowSoftDeleteConfirm(false);
                setDeleteErrorMsg("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-400 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
            >
              Elimina definitivamente
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-rose-300 bg-white p-4">
            <p className="text-sm font-semibold text-rose-900">
              Confermi di voler eliminare definitivamente il tuo account?
            </p>
            <p className="mt-2 text-sm leading-7 text-rose-800">
              Dopo la conferma verrai disconnesso e non potrai recuperare il tuo account.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDeleteAccountPermanently}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-full bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:opacity-60"
              >
                {hardDeleting ? "Eliminazione…" : "Conferma eliminazione definitiva"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowHardDeleteConfirm(false);
                  setDeleteErrorMsg("");
                }}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}