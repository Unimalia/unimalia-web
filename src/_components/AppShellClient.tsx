"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import AuthButtons from "./AuthButtons";

type NavItem = { href: string; label: string };

type AppShellClientProps = {
  nav: NavItem[];
  proHref: string;
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
  fullWidth,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "group relative inline-flex items-center text-sm font-medium transition",
        fullWidth ? "w-full justify-start rounded-xl px-3 py-2.5" : "px-2 py-2",
        fullWidth
          ? active
            ? "bg-zinc-900 text-white"
            : "text-zinc-700 hover:bg-white hover:text-zinc-900"
          : active
            ? "text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900"
      )}
    >
      <span>{label}</span>

      {!fullWidth ? (
        <span
          className={cx(
            "absolute inset-x-2 -bottom-0.5 h-px origin-left transition-transform duration-200",
            active
              ? "scale-x-100 bg-zinc-900"
              : "scale-x-0 bg-zinc-400 group-hover:scale-x-100"
          )}
        />
      ) : null}
    </Link>
  );
}

export default function AppShellClient({ nav, proHref }: AppShellClientProps) {
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

  const items = useMemo(() => nav, [nav]);

  const mobileDrawer =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[1000] md:hidden">
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[2px]"
              aria-label="Chiudi menu"
              onClick={() => setOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-zinc-200 bg-[#f6f1e8] shadow-2xl">
              <div className="flex h-20 items-center justify-between border-b border-zinc-200 px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Navigazione
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">UNIMALIA</p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi menu"
                >
                  ✕
                </button>
              </div>

              <div className="flex h-[calc(100%-5rem)] flex-col overflow-y-auto">
                <div className="px-4 pb-6 pt-5">
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        onClick={() => setOpen(false)}
                        fullWidth
                      />
                    ))}
                  </div>

                  <div className="mt-6 border-t border-zinc-200 pt-6">
                    <Link
                      href={proHref}
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                    >
                      Area professionisti
                    </Link>
                  </div>
                </div>

                <div className="mt-auto border-t border-zinc-200 px-5 py-5">
                  <AuthButtons onNavigate={() => setOpen(false)} />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="hidden min-w-0 flex-1 items-center justify-end gap-8 xl:flex">
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={proHref}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Area professionisti
          </Link>

          <div className="shrink-0">
            <AuthButtons />
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex xl:hidden">
        <Link
          href={proHref}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Area professionisti
        </Link>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          Menu
        </button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Link
          href={proHref}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Area professionisti
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          ☰
        </button>
      </div>

      {mobileDrawer}
    </>
  );
}