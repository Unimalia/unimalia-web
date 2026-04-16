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
      setErrorMsg("Il codice fiscale deve avere 16 caratteri (oppure lascialo vuoto).");
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

    setSuccessMsg("Salvato âœ…");
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
        setDeleteErrorMsg(json?.error || "Errore durante lâ€™eliminazione definitiva account.");
        setHardDeleting(false);
        return;
      }

      await supabase.auth.signOut();

      router.replace("/login?account=eliminato");
      router.refresh();
    } catch {
      setDeleteErrorMsg("Errore di rete durante lâ€™eliminazione definitiva account.");
      setHardDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamentoâ€¦</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">
          Devi effettuare lâ€™accesso per vedere il profilo.
        </p>
        <div className="mt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-900">Email</p>
        <p className="text-sm text-zinc-700">{user.email ?? "â€”"}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-900">Nome</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Nome"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-900">Cognome</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Cognome"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">CittÃ </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Es. Firenze"
          />
          <p className="mt-1 text-xs text-zinc-500">Obbligatorio per creare unâ€™identitÃ  animale.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Telefono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Telefono"
          />
          <p className="mt-1 text-xs text-zinc-500">Obbligatorio per contatti in adozione.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">
            Codice fiscale <span className="text-zinc-500">(facoltativo)</span>
          </label>
          <input
            value={fiscalCode}
            onChange={(e) => setFiscalCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="16 caratteri"
          />
        </div>
      </div>

      {errorMsg ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMsg} {isPending ? "â€¦" : ""}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggioâ€¦" : "Salva"}
        </button>

        <Link
          href="/profilo/abbonamento"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          Abbonamento
        </Link>

        {returnTo ? (
          <Link
            href={returnTo}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Torna indietro
          </Link>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-red-900">Disattiva account</h2>
          <p className="text-sm text-red-800">
            Il tuo account verrÃ  archiviato e lâ€™accesso sarÃ  bloccato. I dati resteranno
            conservati per un eventuale recupero successivo.
          </p>
        </div>

        {deleteErrorMsg ? (
          <div className="mt-3 rounded-xl border border-red-300 bg-white p-3 text-sm text-red-700">
            {deleteErrorMsg}
          </div>
        ) : null}

        {!showSoftDeleteConfirm ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setShowSoftDeleteConfirm(true);
                setShowHardDeleteConfirm(false);
                setDeleteErrorMsg("");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100"
            >
              Disattiva il mio account
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-red-300 bg-white p-4">
            <p className="text-sm font-medium text-red-900">
              Confermi di voler disattivare il tuo account?
            </p>
            <p className="mt-1 text-sm text-red-800">
              Dopo la conferma verrai disconnesso. Lâ€™account resterÃ  archiviato e potrÃ  essere
              recuperato in seguito.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDeactivateAccount}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {softDeleting ? "Disattivazioneâ€¦" : "Conferma disattivazione"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSoftDeleteConfirm(false);
                  setDeleteErrorMsg("");
                }}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-rose-900">Elimina definitivamente account</h2>
          <p className="text-sm text-rose-800">
            Questa operazione Ã¨ irreversibile. I dati personali del tuo account e dellâ€™eventuale
            profilo professionale collegato verranno anonimizzati.
          </p>
        </div>

        {!showHardDeleteConfirm ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setShowHardDeleteConfirm(true);
                setShowSoftDeleteConfirm(false);
                setDeleteErrorMsg("");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-rose-400 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-100"
            >
              Elimina definitivamente
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-rose-300 bg-white p-4">
            <p className="text-sm font-medium text-rose-900">
              Confermi di voler eliminare definitivamente il tuo account?
            </p>
            <p className="mt-1 text-sm text-rose-800">
              Dopo la conferma verrai disconnesso e non potrai recuperare il tuo account.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDeleteAccountPermanently}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-800 disabled:opacity-60"
              >
                {hardDeleting ? "Eliminazioneâ€¦" : "Conferma eliminazione definitiva"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowHardDeleteConfirm(false);
                  setDeleteErrorMsg("");
                }}
                disabled={softDeleting || hardDeleting}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
