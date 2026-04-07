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

  const subtleButton = cx(
    "inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-medium transition"
  );

  return (
    <div className="flex min-h-10 min-w-[188px] items-center justify-end gap-2">
      {loading ? (
        <>
          <div className="h-10 w-[88px] rounded-full bg-zinc-100" />
          <div className="h-10 w-[92px] rounded-full bg-zinc-200" />
        </>
      ) : !session ? (
        <>
          <Link
            href="/login"
            onClick={onNavigate}
            className={cx(
              subtleButton,
              "w-[88px] border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            )}
          >
            Accedi
          </Link>

          <Link
            href="/login?mode=signup"
            onClick={onNavigate}
            className={cx(
              subtleButton,
              "w-[92px] bg-[#f1ede6] text-zinc-900 hover:bg-[#ebe5db]"
            )}
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
              subtleButton,
              "w-[88px] border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            )}
          >
            Profilo
          </Link>

          <button
            type="button"
            onClick={signOut}
            className={cx(
              subtleButton,
              "w-[92px] bg-[#f1ede6] text-zinc-900 hover:bg-[#ebe5db]"
            )}
          >
            Esci
          </button>
        </>
      )}
    </div>
  );
}