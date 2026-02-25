"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AuthButtons from "./AuthButtons";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`
        relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100 hover:text-black"}
      `}
    >
      {children}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4 sm:py-5 pl-2 sm:pl-4">
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
              <NavLink href="/smarrimenti">Smarrimenti</NavLink>

              <NavLink href="/smarrimento">Pubblica (rapido)</NavLink>

              <NavLink href="/ritrovati">Ritrovati</NavLink>

              <NavLink href="/adotta">Adozioni</NavLink>

              <NavLink href="/servizi">Servizi</NavLink>
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