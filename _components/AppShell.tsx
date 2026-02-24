// _components/AppShell.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import AuthButtons from "./AuthButtons";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3 sm:py-4">
          {/* LOGO (animali) solo qui */}
          <Link href="/" className="flex items-center gap-3" aria-label="Vai alla home UNIMALIA">
            <Image
              src="/logo-main.png"
              alt="UNIMALIA"
              width={120}
              height={110}
              priority
              className="h-11 w-auto sm:h-12"
            />
          </Link>

          {/* NAV + AUTH */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
              <Link
                href="/smarrimenti"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Smarrimenti
              </Link>

              <Link
                href="/smarrimento"
                aria-label="Pubblica smarrimento (pagina rapida)"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Pubblica (rapido)
              </Link>

              <Link
                href="/ritrovati"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Ritrovati
              </Link>

              <Link
                href="/adotta"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Adozioni
              </Link>

              <Link
                href="/servizi"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Servizi
              </Link>
            </nav>

            <AuthButtons />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container-page py-8 sm:py-10">{children}</main>

      {/* FOOTER */}
      <footer className="mt-14 border-t border-zinc-200 bg-white">
        <div className="container-page py-8 text-sm text-zinc-600">
          <p>
            UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà reinvestita nel progetto e una parte
            devolverà valore al mondo animale.
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

          <p className="mt-4 text-xs text-zinc-500">© {new Date().getFullYear()} UNIMALIA</p>
        </div>
      </footer>
    </div>
  );
}