"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AuthButtons() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <div className="h-9 w-24 rounded-xl bg-zinc-100" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className={cx(
            "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition",
            "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
          )}
        >
          Accedi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profilo"
        className={cx(
          "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition",
          "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
        )}
      >
        Profilo
      </Link>

      <button
        type="button"
        onClick={signOut}
        className={cx(
          "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition",
          "bg-zinc-900 text-white hover:bg-black"
        )}
      >
        Esci
      </button>
    </div>
  );
}