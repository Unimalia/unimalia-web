// app/debug/profilo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function DebugProfiloPage() {
  const [loading, setLoading] = useState(true);

  const [authUser, setAuthUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string>("");

  const [profileRow, setProfileRow] = useState<any>(null);
  const [profileError, setProfileError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setAuthError("");
      setProfileError("");
      setAuthUser(null);
      setProfileRow(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userErr || !userData.user) {
        setAuthError(userErr?.message || "No user");
        setLoading(false);
        return;
      }

      setAuthUser(userData.user);

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profErr) setProfileError(profErr.message);
      setProfileRow(prof ?? null);

      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Debug Profilo</h1>

      {loading ? <p className="mt-3 text-sm text-zinc-700">Caricamento…</p> : null}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Auth</h2>
        {authError ? <p className="mt-2 text-sm text-red-700">{authError}</p> : null}
        {authUser ? (
          <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
            {JSON.stringify(
              {
                id: authUser.id,
                email: authUser.email,
                phone: authUser.phone,
                user_metadata: authUser.user_metadata,
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">profiles (select *)</h2>
        {profileError ? <p className="mt-2 text-sm text-red-700">{profileError}</p> : null}
        <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
          {JSON.stringify(profileRow, null, 2)}
        </pre>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Apri questa pagina da browser: <b>/debug/profilo</b>
      </p>
    </div>
  );
}