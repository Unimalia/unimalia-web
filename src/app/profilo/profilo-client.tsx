// app/profilo/profilo-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  fiscal_code: string | null;
  phone: string | null;
};

function buildFullName(first: string, last: string) {
  return `${first}`.trim() && `${last}`.trim() ? `${first.trim()} ${last.trim()}` : `${first} ${last}`.trim();
}

export function ProfiloClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const returnTo = useMemo(() => sp.get("returnTo") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
        .select("id, first_name, last_name, full_name, fiscal_code, phone")
        .eq("id", u.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) {
        setErrorMsg(profErr.message);
        setLoading(false);
        return;
      }

      const row = (prof ?? null) as ProfileRow | null;

      // Preferiamo first/last, altrimenti proviamo a derivare da full_name
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

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
      },
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

    const payload: Partial<ProfileRow> = {
      first_name: first || null,
      last_name: last || null,
      full_name: full || null,
      fiscal_code: fiscalCode.trim() || null,
      phone: phone.trim() || null,
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Devi effettuare l’accesso per vedere il profilo.</p>
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
        <p className="text-sm text-zinc-700">{user.email ?? "—"}</p>
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
          <label className="text-sm font-medium text-zinc-900">Codice fiscale</label>
          <input
            value={fiscalCode}
            onChange={(e) => setFiscalCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
            placeholder="Codice fiscale"
          />
        </div>
      </div>

      {errorMsg ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}

      {successMsg ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMsg} {isPending ? "…" : ""}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggio…" : "Salva"}
        </button>

        {returnTo ? (
          <Link
            href={returnTo}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Torna indietro
          </Link>
        ) : null}
      </div>
    </div>
  );
}