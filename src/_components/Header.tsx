"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
        "inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-black text-white"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
      )}
    >
      {label}
    </Link>
  );
}

export default function Header({
  rightSlot,
}: {
  rightSlot?: React.ReactNode;
}) {
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

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      {/* usa lo stesso container del main */}
      <div className="container-page flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
        {/* Brand: logo animale (come hai in AppShell) */}
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

        {/* Desktop nav */}
        <nav className="hidden min-w-0 items-center gap-1 md:flex">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/smarrimenti/nuovo"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
          >
            Pubblica
          </Link>
          {rightSlot}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/30"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-[88%] max-w-sm border-l border-zinc-200 bg-white shadow-2xl">
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

            <div className="px-4 pb-6">
              <div className="flex flex-col gap-1">
                {nav.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>

              <div className="mt-4 border-t border-zinc-200 pt-4">
                <Link
                  href="/smarrimenti/nuovo"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
                >
                  Pubblica smarrimento
                </Link>

                {rightSlot ? <div className="mt-3">{rightSlot}</div> : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}