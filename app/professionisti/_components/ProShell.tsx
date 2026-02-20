import React from "react";
import Link from "next/link";

export default function ProShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3 sm:py-4">
          <Link href="/professionisti" className="flex items-center gap-3">
            <img src="/logo.png" alt="UNIMALIA" className="h-10 w-auto" />
            <span className="text-sm font-semibold text-zinc-900">
              Portale Professionisti
            </span>
          </Link>

          <nav className="flex items-center gap-1">
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
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">{children}</main>

      <footer className="mt-14 border-t border-zinc-200 bg-white">
        <div className="container-page py-6 text-xs text-zinc-500">
          Ambiente professionisti — strumenti rapidi per visite, vaccinazioni e documenti.
        </div>
      </footer>
    </div>
  );
}