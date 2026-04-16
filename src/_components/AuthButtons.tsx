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
  compact?: boolean;
  fullWidth?: boolean;
};

export default function AuthButtons({
  onNavigate,
  compact = false,
  fullWidth = false,
}: AuthButtonsProps = {}) {
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

  const containerClass = fullWidth
    ? "flex min-h-10 w-full flex-col items-stretch gap-2"
    : compact
      ? "flex min-h-10 items-center justify-end gap-2"
      : "flex min-h-10 min-w-[188px] items-center justify-end gap-2";

  const firstButtonClass = fullWidth ? "w-full" : compact ? "w-[82px]" : "w-[88px]";
  const secondButtonClass = fullWidth ? "w-full" : compact ? "w-[86px]" : "w-[92px]";

  return (
    <div className={containerClass}>
      {loading ? (
        <>
          <div className={cx("h-10 rounded-full bg-zinc-100", firstButtonClass)} />
          <div className={cx("h-10 rounded-full bg-zinc-200", secondButtonClass)} />
        </>
      ) : !session ? (
        <>
          <Link
            href="/login"
            onClick={onNavigate}
            className={cx(
              subtleButton,
              firstButtonClass,
              "border border-[#d7dfe9] bg-white text-[#31486f] hover:bg-[#f8fbff]"
            )}
          >
            Accedi
          </Link>

          <Link
            href="/login?mode=signup"
            onClick={onNavigate}
            className={cx(
              subtleButton,
              secondButtonClass,
              "bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] text-white shadow-[0_10px_20px_rgba(47,105,199,0.18)] hover:opacity-95"
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
              firstButtonClass,
              "border border-[#d7dfe9] bg-white text-[#31486f] hover:bg-[#f8fbff]"
            )}
          >
            Profilo
          </Link>

          <button
            type="button"
            onClick={signOut}
            className={cx(
              subtleButton,
              secondButtonClass,
              "bg-[#f4f7fb] text-[#30486f] hover:bg-[#eaf1f8]"
            )}
          >
            Esci
          </button>
        </>
      )}
    </div>
  );
}
