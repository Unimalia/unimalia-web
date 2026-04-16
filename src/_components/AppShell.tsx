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
  { href: "/identita", label: "IdentitÃ  animale" },
];

const proHref = "/professionisti/dashboard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfessionalArea = pathname?.startsWith("/professionisti");
  const isHomePage = pathname === "/";

  if (isProfessionalArea) {
    return <>{children}</>;
  }

  if (isHomePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-[#e3e9f0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-4"
            aria-label="Vai alla home UNIMALIA"
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-white shadow-[0_10px_24px_rgba(42,56,86,0.08)] ring-1 ring-[#e3e9f0] sm:h-14 sm:w-14">
              <Image
                src="/home/logo-app.png"
                alt="UNIMALIA"
                width={120}
                height={110}
                priority
                className="h-9 w-auto transition duration-300 group-hover:scale-[1.04] sm:h-10"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                UNIMALIA
              </p>
              <p className="truncate text-sm font-medium text-[#30486f] sm:text-[15px]">
                IdentitÃ  animale, emergenza e continuitÃ  clinica
              </p>
            </div>
          </Link>

          <AppShellClient nav={nav} proHref={proHref} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>

      <footer className="mt-24 border-t border-[#e3e9f0] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
              UNIMALIA
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f] sm:text-3xl">
              Un modo piÃ¹ chiaro per proteggere informazioni, accessi e momenti importanti.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[#5f708a] sm:text-base">
              UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrÃ  reinvestita nel
              progetto e una parte devolverÃ  valore al mondo animale.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Esplora</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#5f708a]">
                <Link className="transition hover:text-[#30486f]" href="/smarrimenti">
                  Smarrimenti
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/trovati">
                  Trovati / Avvistati
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/lieti-fine">
                  Lieti Fine
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/identita">
                  IdentitÃ  animale
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/professionisti/dashboard">
                  Professionisti
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900">Informazioni</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#5f708a]">
                <Link className="transition hover:text-[#30486f]" href="/privacy">
                  Privacy
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/cookie">
                  Cookie
                </Link>
                <Link className="transition hover:text-[#30486f]" href="/termini">
                  Termini
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#eef2f7]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-[#55657d] sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>Â© {new Date().getFullYear()} UNIMALIA</p>
            <p>Meno dispersione, piÃ¹ chiarezza, piÃ¹ continuitÃ .</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
