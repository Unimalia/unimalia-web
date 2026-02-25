"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const pill =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition " +
  "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100";

const primary =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition " +
  "bg-black text-white hover:bg-zinc-900";

export default function AuthButtons() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    );
  }

  // === NON LOGGATO ===
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={pill}>
          Accedi
        </Link>

        <Link href="/identita/nuovo" className={primary}>
          Registrati
        </Link>
      </div>
    );
  }

  // === LOGGATO ===
  return (
    <div className="flex items-center gap-2">
      <Link href="/profilo" className={pill}>
        Profilo
      </Link>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        className={primary}
      >
        Esci
      </button>
    </div>
  );
}