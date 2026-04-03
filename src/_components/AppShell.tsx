"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AppShellClient from "./AppShellClient";

type NavItem = { href: string; label: string };

const nav: NavItem[] = [
  { href: "/smarrimenti", label: "Smarrimenti" },
  { href: "/trovati", label: "Trovati / Avvistati" },
  { href: "/lieti-fine", label: "Lieti Fine" },
  { href: "/adotta", label: "Adozioni" },
  { href: "/servizi", label: "Servizi" },
  { href: "/identita", label: "Identità animale" },
];

const proHref = "/professionisti/dashboard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfessionalArea = pathname?.startsWith("/professionisti");

  if (isProfessionalArea) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf8f4]/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-3"
              aria-label="Vai alla home UNIMALIA"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:h-12 sm:w-12">
                <Image
                  src="/logo-main.png"
                  alt="UNIMALIA"
                  width={120}
                  height={110}
                  priority
                  className="h-9 w-auto transition duration-300 group-hover:scale-[1.03] sm:h-10"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  UNIMALIA
                </p>
                <p className="truncate text-sm font-medium text-zinc-800">
                  Identità animale e continuità clinica
                </p>
              </div>
            </Link>

            <AppShellClient nav={nav} proHref={proHref} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>

      <footer className="mt-20 border-t border-black/5 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              UNIMALIA
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Un modo più ordinato per proteggere le informazioni che contano davvero.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
              UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà reinvestita nel
              progetto e una parte devolverà valore al mondo animale.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Esplora</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600">
                <Link className="transition hover:text-zinc-900" href="/smarrimenti">
                  Smarrimenti
                </Link>
                <Link className="transition hover:text-zinc-900" href="/trovati">
                  Trovati / Avvistati
                </Link>
                <Link className="transition hover:text-zinc-900" href="/identita">
                  Identità animale
                </Link>
                <Link className="transition hover:text-zinc-900" href="/professionisti/dashboard">
                  Professionisti
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900">Informazioni</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600">
                <Link className="transition hover:text-zinc-900" href="/privacy">
                  Privacy
                </Link>
                <Link className="transition hover:text-zinc-900" href="/cookie">
                  Cookie
                </Link>
                <Link className="transition hover:text-zinc-900" href="/termini">
                  Termini
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-zinc-500 sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>© {new Date().getFullYear()} UNIMALIA</p>
            <p>Più chiarezza, meno dispersione, più continuità.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}