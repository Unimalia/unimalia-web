"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AuthButtonsProps = {
  onNavigate?: () => void;
};

export default function AuthButtons({ onNavigate }: AuthButtonsProps = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setSession(null);
          setLoading(false);

          await supabase.auth.signOut({ scope: "local" });
          return;
        }

        setSession(data.session ?? null);
        setLoading(false);
      } catch {
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      }
    }

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const baseButtonClass = cx(
    "inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
  );

  return (
    <div className="flex min-h-10 min-w-[196px] items-center justify-end gap-2">
      {loading ? (
        <>
          <div className="h-10 w-[92px] rounded-xl bg-zinc-100" />
          <div className="h-10 w-[96px] rounded-xl bg-zinc-200" />
        </>
      ) : !session ? (
        <>
          <Link
            href="/login"
            onClick={onNavigate}
            className={cx(
              baseButtonClass,
              "w-[92px] border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
          >
            Accedi
          </Link>

          <Link
            href="/login?mode=signup"
            onClick={onNavigate}
            className={cx(baseButtonClass, "w-[96px] bg-zinc-900 text-white hover:bg-black")}
          >
            Iscriviti
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/profilo"
            onClick={onNavigate}
            className={cx(
              baseButtonClass,
              "w-[92px] border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
          >
            Profilo
          </Link>

          <button
            type="button"
            onClick={signOut}
            className={cx(baseButtonClass, "w-[96px] bg-zinc-900 text-white hover:bg-black")}
          >
            Esci
          </button>
        </>
      )}
    </div>
  );
}