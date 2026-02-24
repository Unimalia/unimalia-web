"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  full_name: string | null;
};

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user ?? null;

    setEmail(user?.email ?? null);

    if (!user) {
      setFullName(null);
      return;
    }

    // prova a leggere profilo
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const prof = (p as Profile | null) ?? null;
    const name = (prof?.full_name ?? "").trim();

    setFullName(name.length >= 3 ? name : null);
  }

  useEffect(() => {
    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
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
      <Link
        href="/login"
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Accedi
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profilo"
        className="hidden text-sm text-zinc-700 hover:underline sm:inline"
        title="Apri il tuo profilo"
      >
        {fullName ?? email}
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