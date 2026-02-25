"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AuthButtons from "./AuthButtons";

type NavItem = { href: string; label: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "relative inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-black text-white"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
      )}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = useMemo(
    () => [
      { href: "/smarrimenti", label: "Smarrimenti" },
      { href: "/ritrovati", label: "Ritrovati" },
      { href: "/adotta", label: "Adozioni" },
      { href: "/servizi", label: "Servizi" },
      { href: "/professionisti", label: "Professionisti" },
    ],
    []
  );

  // chiude menu su ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // blocca scroll quando drawer aperto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-4 sm:py-5 pl-2 sm:pl-4">
          {/* LOGO */}
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

          {/* DESKTOP: NAV + CTA + AUTH */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
            <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto whitespace-nowrap">
              {nav.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>

            <Link
              href="/smarrimenti/nuovo"
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Pubblica
            </Link>

            <AuthButtons />
          </div>

          {/* MOBILE: hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/smarrimenti/nuovo"
              className="inline-flex items-center justify-center rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Pubblica
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
              onClick={() => setOpen(true)}
              aria-label="Apri menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {open && (
          <div className="md:hidden">
            {/* overlay */}
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-black/30"
              aria-label="Chiudi menu"
              onClick={() => setOpen(false)}
            />
            {/* panel */}
            <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-zinc-200 bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between px-4">
                <span className="text-sm font-semibold">Menu</span>
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
                  {nav.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      onClick={() => setOpen(false)}
                    />
                  ))}

                  {/* se vuoi tenere “Pubblica (rapido)” come route separata */}
                  <NavLink
                    href="/smarrimento"
                    label="Pubblica (rapido)"
                    onClick={() => setOpen(false)}
                  />
                </div>

                <div className="mt-4 border-t border-zinc-200 px-2 pt-4">
                  <Link
                    href="/smarrimenti/nuovo"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
                  >
                    Pubblica
                  </Link>

                  <div className="mt-3">
                    <AuthButtons />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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