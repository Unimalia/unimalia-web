// app/debug/profiles-keys/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProfilesKeysDebugPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [keys, setKeys] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setErr("");
      setKeys([]);
      setPreview(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userErr || !userData.user) {
        setErr(userErr?.message || "No user");
        setLoading(false);
        return;
      }

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) {
        setErr(profErr.message);
        setLoading(false);
        return;
      }

      const row = (prof ?? null) as Record<string, any> | null;

      if (!row) {
        setKeys([]);
        setPreview(null);
        setLoading(false);
        return;
      }

      const k = Object.keys(row).sort((a, b) => a.localeCompare(b));
      setKeys(k);

      // preview: mostra solo tipi e se il valore è vuoto/non vuoto, non il valore
      const safePreview: Record<string, any> = {};
      for (const key of k) {
        const v = row[key];
        const isEmpty =
          v === null ||
          v === undefined ||
          (typeof v === "string" && v.trim() === "") ||
          (Array.isArray(v) && v.length === 0);

        safePreview[key] = {
          type: Array.isArray(v) ? "array" : typeof v,
          empty: isEmpty,
        };
      }
      setPreview(safePreview);

      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Debug profiles keys</h1>

      {loading ? <p className="mt-3 text-sm text-zinc-700">Caricamento…</p> : null}
      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Colonne trovate</h2>
        <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
          {JSON.stringify(keys, null, 2)}
        </pre>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Preview (tipo + empty)</h2>
        <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Apri: <b>/debug/profiles-keys</b>
      </p>
    </div>
  );
}