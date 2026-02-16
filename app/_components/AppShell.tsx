// app/_components/AppShell.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthButtons from "@/app/_components/AuthButtons";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isPro = pathname.startsWith("/professionisti");
  const router = useRouter();

  // (opzionale) mostra email in pro
  const [proEmail, setProEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isPro) return;

    supabase.auth.getSession().then(({ data }) => {
      setProEmail(data.session?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setProEmail(session?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [isPro]);

  async function proLogout() {
    await supabase.auth.signOut();
    router.push("/professionisti/login");
  }

  // ======================
  // LAYOUT PROFESSIONISTI
  // ======================
  if (isPro) {
    return (
      <>
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/professionisti" className="flex items-center gap-2">
              <img src="/logo.png" alt="UNIMALIA" className="h-10 w-auto" />
              <span className="hidden text-sm font-semibold text-zinc-900 sm:inline">
                Professionisti
              </span>
            </Link>

            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
              <Link
                href="/professionisti"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Dashboard
              </Link>
              <Link
                href="/professionisti/scansiona"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Scansiona
              </Link>
              <Link
                href="/professionisti/skill"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Skill
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/servizi"
                className="hidden rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 sm:inline-flex"
                title="Vai alla parte pubblica (servizi)"
              >
                Vai ai Servizi
              </Link>

              {proEmail ? (
                <>
                  <span className="hidden text-sm text-zinc-600 sm:inline">{proEmail}</span>
                  <button
                    onClick={proLogout}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Esci
                  </button>
                </>
              ) : (
                <Link
                  href="/professionisti/login"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Accedi
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>

        <footer className="mt-14 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600 sm:px-6">
            <p className="text-xs text-zinc-500">
              © {new Date().getFullYear()} UNIMALIA • Portale Professionisti
            </p>
          </div>
        </footer>
      </>
    );
  }

  // ==============
  // LAYOUT PUBBLICO
  // ==============
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="UNIMALIA" className="h-40 w-auto -ml-10" />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
              <Link
                href="/smarrimenti"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Smarrimenti
              </Link>

              <Link
                href="/smarrimento"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Pubblica smarrimento
              </Link>

              <Link
                href="/ritrovati"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Ritrovati
              </Link>

              <Link
                href="/servizi"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Servizi
              </Link>

              {/* ✅ RIPRISTINATE */}
              <Link
                href="/miei-annunci"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                I miei annunci
              </Link>

              <Link
                href="/identita"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Identità animale
              </Link>
            </nav>

            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="mt-14 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-600 sm:px-6">
          <p>
            UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà
            reinvestita nel progetto e una parte devolverà valore al mondo animale.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link className="hover:underline" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:underline" href="/cookie">
              Cookie
            </Link>
            <Link className="hover:underline" href="/termini">
              Termini
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            © {new Date().getFullYear()} UNIMALIA
          </p>
        </div>
      </footer>
    </>
  );
}
