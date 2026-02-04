"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // session iniziale
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });

    // listen cambi sessione
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!email) {
    return (
      <a
        href="/login"
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Accedi
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-zinc-600 sm:inline">{email}</span>
      <button
        onClick={handleLogout}
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Esci
      </button>
    </div>
  );
}
