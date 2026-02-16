"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  full_name: string | null;
};

export default function AuthButtons() {
  const [userId, setUserId] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null); // Nome Cognome (fallback email)
  const [loading, setLoading] = useState(true);

  async function loadLabel(sessionUserId: string, fallbackEmail: string | null) {
    try {
      // assicura riga profiles (se non esiste)
      await supabase.from("profiles").upsert({ id: sessionUserId }, { onConflict: "id" });

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sessionUserId)
        .single();

      const p = data as ProfileRow | null;
      const name = (p?.full_name ?? "").trim();

      setLabel(name.length >= 3 ? name : fallbackEmail);
    } catch {
      setLabel(fallbackEmail);
    }
  }

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!alive) return;

      if (!user) {
        setUserId(null);
        setLabel(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadLabel(user.id, user.email ?? null);

      if (!alive) return;
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setUserId(null);
        setLabel(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setLoading(true);
      await loadLabel(user.id, user.email ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Non loggato
  if (!userId) {
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
      <Link
        href="/profilo"
        className="hidden max-w-[240px] truncate text-sm text-zinc-700 hover:underline sm:inline"
        title={label ?? "Profilo"}
      >
        {loading ? "Profilo…" : label ?? "Profilo"}
      </Link>

      <button
        onClick={handleLogout}
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Esci
      </button>
    </div>
  );
}
