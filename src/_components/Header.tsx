"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

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
          : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
      )}
    >
      {label}
    </Link>
  );
}

export default function Header({
  rightSlot,
}: {
  /** opzionale: bottoni login/profile ecc. */
  rightSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // chiude drawer su ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // blocca scroll body quando drawer aperto
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
      { href: "/adotta", label: "Adotta" },
      { href: "/servizi", label: "Servizi" },
      { href: "/professionisti", label: "Professionisti" },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* qui puoi mettere il tuo logo */}
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-neutral-900 text-white">
              <span className="text-sm font-semibold">U</span>
            </div>
            <span className="hidden text-sm font-semibold tracking-tight text-neutral-900 sm:inline">
              UNIMALIA
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* CTA */}
          <Link
            href="/smarrimenti/nuovo"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Pubblica
          </Link>

          {/* Slot per auth buttons ecc */}
          {rightSlot}
        </div>

        {/* Mobile button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
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
          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-neutral-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="text-sm font-semibold">Menu</span>
              <button
                type="button"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold"
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
              </div>

              <div className="mt-4 border-t border-neutral-200 pt-4 px-2">
                <Link
                  href="/smarrimenti/nuovo"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Pubblica
                </Link>

                {rightSlot ? (
                  <div className="mt-3">{rightSlot}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}