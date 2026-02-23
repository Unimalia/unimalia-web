import React from "react";
import Link from "next/link";
import AuthButtons from "./AuthButtons";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <img
                src="/logo.png"
                alt="UNIMALIA"
                className="h-7 w-auto"
                loading="eager"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-extrabold tracking-tight text-zinc-900">
                UNIMALIA
              </p>
              <p className="text-xs text-zinc-500">Serio ma umano</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/identita">Identità</NavLink>
            <NavLink href="/smarrimenti">Smarrimenti</NavLink>
            <NavLink href="/ritrovati">Ritrovati</NavLink>
            <NavLink href="/servizi">Servizi</NavLink>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Primary CTA */}
            <Link
              href="/identita/nuovo"
              className="hidden rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 sm:inline-flex"
            >
              Crea identità
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/smarrimenti/nuovo"
              className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 lg:inline-flex"
            >
              Pubblica smarrimento
            </Link>

            {/* Auth */}
            <AuthButtons />
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="border-t border-zinc-200 bg-white/70 md:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-8">
            <NavLink href="/identita">Identità</NavLink>
            <NavLink href="/smarrimenti">Smarrimenti</NavLink>
            <NavLink href="/ritrovati">Ritrovati</NavLink>
            <NavLink href="/servizi">Servizi</NavLink>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="text-sm font-semibold text-zinc-900">UNIMALIA</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                UNIMALIA nasce come impresa responsabile: una parte dei ricavi
                verrà reinvestita nel progetto e una parte devolverà valore al
                mondo animale.
              </p>
            </div>

            <div className="md:col-span-5">
              <p className="text-sm font-semibold text-zinc-900">Info</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-700">
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

              <p className="mt-6 text-xs text-zinc-500">
                © {new Date().getFullYear()} UNIMALIA
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}