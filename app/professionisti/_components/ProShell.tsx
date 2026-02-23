import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function ProShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-128.webp"
              alt="UNIMALIA"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">UNIMALIA</p>
              <p className="text-xs text-zinc-500">Professionisti</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
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
          </nav>
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">{children}</main>
    </div>
  );
}