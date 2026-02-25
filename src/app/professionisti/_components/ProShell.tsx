"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function isActive(pathname: string, href: string) {
  return href === "/professionisti" ? pathname === href : pathname.startsWith(href);
}

type Item = { href: string; label: string };

function SideLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
      )}
    >
      {label}
    </Link>
  );
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items: Item[] = useMemo(
    () => [
      { href: "/professionisti", label: "Dashboard" },
      { href: "/professionisti/scansiona", label: "Scansiona" },
      { href: "/professionisti/animali", label: "Animali" },
      { href: "/professionisti/richieste", label: "Richieste" },
      { href: "/professionisti/nuovo", label: "Nuovo" },
      { href: "/professionisti/impostazioni", label: "Impostazioni" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        {/* allineamento come body: usa container-page */}
        <div className="container-page flex items-center justify-between gap-3 py-3 sm:py-4 px-3 sm:px-0">
          {/* Wordmark + payoff (qui lo rendiamo “come home” dopo che mi incolli il pezzo hero) */}
          <Link href="/" className="min-w-0" aria-label="Vai alla home UNIMALIA">
            <div className="truncate text-sm font-semibold tracking-tight text-zinc-900">UNIMALIA</div>
            <div className="hidden truncate text-xs text-zinc-600 sm:block">
              Portale Professionisti
            </div>
          </Link>

          {/* actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/professionisti/nuovo"
              className="hidden sm:inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Nuovo
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-zinc-50 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Apri menu"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="container-page grid grid-cols-1 gap-6 py-6 sm:py-8 lg:grid-cols-[260px_1fr] px-3 sm:px-0">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-500">Menu</div>
            <div className="flex flex-col gap-1">
              {items.map((it) => (
                <SideLink key={it.href} href={it.href} label={it.label} />
              ))}
            </div>

            <div className="mt-3 border-t border-zinc-200 pt-3 px-2">
              <Link
                href="/professionisti/nuovo"
                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Crea nuova scheda
              </Link>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0">{children}</main>
      </div>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/30"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-zinc-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="text-sm font-semibold">Portale Professionisti</span>
              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold"
                onClick={() => setOpen(false)}
                aria-label="Chiudi menu"
              >
                ✕
              </button>
            </div>

            <div className="px-2 pb-6">
              <div className="flex flex-col gap-1">
                {items.map((it) => (
                  <SideLink
                    key={it.href}
                    href={it.href}
                    label={it.label}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>

              <div className="mt-4 border-t border-zinc-200 pt-4 px-2">
                <Link
                  href="/professionisti/nuovo"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                >
                  Crea nuova scheda
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}