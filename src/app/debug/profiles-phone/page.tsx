// app/debug/profiles-phone/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function DebugProfilesPhonePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setErr("");
      setData(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userErr || !userData.user) {
        setErr(userErr?.message || "No user");
        setLoading(false);
        return;
      }

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone, fiscal_code")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) {
        setErr(profErr.message);
        setLoading(false);
        return;
      }

      setData(prof ?? null);
      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Debug profiles phone</h1>

      {loading ? <p className="mt-3 text-sm text-zinc-700">Caricamento…</p> : null}

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      <pre className="mt-6 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800">
        {JSON.stringify(data, null, 2)}
      </pre>

      <p className="mt-3 text-xs text-zinc-500">
        Apri: <b>/debug/profiles-phone</b>
      </p>
    </div>
  );
}