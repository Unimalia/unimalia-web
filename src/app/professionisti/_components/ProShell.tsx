// app/professionisti/_components/ProShell.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function ProShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-main.webp"
              alt="UNIMALIA"
              width={120}
              height={110}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
            <Link
              href="/professionisti"
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Dashboard
            </Link>
            <Link
              href="/professionisti/scansiona"
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Scansiona
            </Link>
            <Link
              href="/professionisti/nuovo"
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Nuovo
            </Link>
          </nav>
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">{children}</main>
    </div>
  );
}