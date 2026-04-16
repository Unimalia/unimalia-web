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
        fullWidth ? "w-full justify-start rounded-2xl px-3 py-2.5" : "px-2 py-2",
        fullWidth
          ? active
            ? "bg-[#30486f] text-white"
            : "text-[#5f708a] hover:bg-[#f8fbff] hover:text-[#30486f]"
          : active
            ? "text-[#30486f]"
            : "text-[#5f708a] hover:text-[#30486f]"
      )}
    >
      <span>{label}</span>

      {!fullWidth ? (
        <span
          className={cx(
            "absolute inset-x-2 -bottom-0.5 h-px origin-left transition-transform duration-200",
            active
              ? "scale-x-100 bg-[#30486f]"
              : "scale-x-0 bg-[#7a8ea8] group-hover:scale-x-100"
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
          <div className="fixed inset-0 z-[1000] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[2px]"
              aria-label="Chiudi menu"
              onClick={() => setOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-[#e3e9f0] bg-white shadow-2xl">
              <div className="flex h-20 items-center justify-between border-b border-[#e3e9f0] px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
                    Navigazione
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#30486f]">UNIMALIA</p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7dfe9] bg-white text-sm font-semibold text-[#30486f] shadow-sm transition hover:bg-[#f8fbff]"
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi menu"
                >
                  âœ•
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

                  <div className="mt-6 border-t border-[#e3e9f0] pt-6">
                    <Link
                      href={proHref}
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
                    >
                      Area professionisti
                    </Link>
                  </div>
                </div>

                <div className="mt-auto border-t border-[#e3e9f0] px-5 py-5">
                  <AuthButtons onNavigate={() => setOpen(false)} fullWidth />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="hidden min-w-0 flex-1 items-center justify-end gap-6 lg:flex">
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={proHref}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
          >
            Area professionisti
          </Link>

          <div className="shrink-0">
            <AuthButtons />
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex lg:hidden">
        <div className="shrink-0">
          <AuthButtons compact />
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 text-sm font-semibold text-[#30486f] shadow-sm transition hover:bg-[#f8fbff]"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          Menu
        </button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dfe9] bg-white text-sm font-semibold text-[#30486f] shadow-sm transition hover:bg-[#f8fbff]"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          â˜°
        </button>
      </div>

      {mobileDrawer}
    </>
  );
}
