"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProfessionistiBrand } from "./ProfessionistiBrand";
import { supabase } from "@/lib/supabaseClient";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  return href === "/professionisti" ? pathname === href : pathname.startsWith(href);
}

type Item = { href: string; label: string };

function SideLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
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

function isProfessionalUser(u: any) {
  if (!u) return false;

  // ✅ PASSAPARTOUT: allowlist email (subito funzionante senza Supabase meta)
  const email = String(u.email || "").toLowerCase();
  const allow = new Set([
    "valentinotwister@hotmail.it",
    // aggiungi altre email professionisti qui:
    // "clinica@example.com",
  ]);
  if (allow.has(email)) return true;

  // ✅ In futuro: ruolo vero su metadata
  return Boolean(u?.app_metadata?.is_professional || u?.user_metadata?.is_professional);
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // BLINDATURA: in /professionisti serve login professionista
  useEffect(() => {
    let alive = true;

    async function check() {
      // lascia passare la pagina di login professionisti
      if (pathname?.startsWith("/professionisti/login")) {
        if (alive) setAuthChecked(true);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (!user || !isProfessionalUser(user)) {
        router.replace(
          "/professionisti/login?next=" + encodeURIComponent(pathname || "/professionisti")
        );
        return;
      }

      setAuthChecked(true);
    }

    check();
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  // ESC chiude drawer
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // lock scroll drawer
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
      { href: "/professionisti/impostazioni", label: "Impostazioni" },
    ],
    []
  );

  // skeleton mentre verifica auth
  if (!authChecked) {
    return (
      <div data-pro-portal="true" className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="container-page px-3 sm:px-0 py-10">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-zinc-200/70" />
            <div className="mt-3 h-4 w-full max-w-xl rounded bg-zinc-200/50" />
            <div className="mt-1 h-4 w-full max-w-lg rounded bg-zinc-200/40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-pro-portal="true" className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* TOP BAR (solo portale) */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3 sm:py-4 px-3 sm:px-0">
          <Link
            href="/professionisti"
            className="min-w-0 select-none"
            aria-label="Vai alla dashboard professionisti"
          >
            <div className="leading-none">
              <ProfessionistiBrand />
            </div>
            <div className="mt-2 hidden truncate text-xs text-zinc-600 sm:block">
              Portale Professionisti
            </div>
          </Link>

          <div className="flex items-center gap-2">
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
            <div className="flex items-center justify-between px-4 py-4">
              <div className="select-none">
                <ProfessionistiBrand />
                <div className="mt-2 text-xs text-zinc-600">Portale Professionisti</div>
              </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}