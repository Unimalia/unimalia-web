"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProfessionistiBrand } from "./ProfessionistiBrand";
import ConsultsSidebarBadge from "./ConsultsSidebarBadge";
import { supabase } from "@/lib/supabaseClient";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/professionisti") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

type Item = {
  href: string;
  label: React.ReactNode;
  description?: string;
};

function getEmail(u: any) {
  return String(u?.email || "").toLowerCase().trim();
}

export function isProfessionalUser(u: any) {
  if (!u) return false;
  return Boolean(u?.app_metadata?.is_professional || u?.user_metadata?.is_professional);
}

export function isVetUser(u: any) {
  if (!u) return false;
  const email = getEmail(u);
  if (email === "valentinotwister@hotmail.it") return true;
  return Boolean(u?.app_metadata?.is_vet || u?.user_metadata?.is_vet);
}

function SideLink({
  href,
  label,
  description,
  onClick,
}: {
  href: string;
  label: React.ReactNode;
  description?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "block rounded-2xl px-3 py-3 transition",
        active ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
      )}
    >
      <div className="text-sm font-semibold">{label}</div>
      {description ? (
        <div
          className={cx(
            "mt-1 text-xs leading-relaxed",
            active ? "text-white/80" : "text-zinc-500"
          )}
        >
          {description}
        </div>
      ) : null}
    </Link>
  );
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;

    async function hardRedirectToLogin() {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      if (!alive) return;

      router.replace(
        "/professionisti/login?next=" +
          encodeURIComponent(pathname || "/professionisti/dashboard")
      );
    }

    async function check() {
      if (pathname?.startsWith("/professionisti/login")) {
        if (alive) setAuthChecked(true);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      const msg = String((error as any)?.message || "");

      if (error && msg.toLowerCase().includes("refresh token")) {
        await hardRedirectToLogin();
        return;
      }

      const user = data?.user;

      if (!alive) return;

      if (!user || !isProfessionalUser(user)) {
        router.replace(
          "/professionisti/login?next=" +
            encodeURIComponent(pathname || "/professionisti/dashboard")
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

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      setOpen(false);
      router.replace("/professionisti/login");
    }
  }

  const items: Item[] = useMemo(
    () => [
      {
        href: "/professionisti/dashboard",
        label: "Dashboard",
        description: "Panoramica operativa dell’area professionisti.",
      },
      {
        href: "/professionisti/scansiona",
        label: "Scansiona",
        description: "Microchip, QR o codice identificativo animale.",
      },
      {
        href: "/professionisti/animali",
        label: "Animali in gestione",
        description: "Animali con accesso attivo per la tua struttura.",
      },
      {
        href: "/professionisti/richieste-accesso",
        label: "Richieste accesso",
        description: "Invia richieste e monitora gli stati di autorizzazione.",
      },
      {
        href: "/professionisti/richieste",
        label: (
          <span className="inline-flex items-center">
            <span>Consulti</span>
            <ConsultsSidebarBadge />
          </span>
        ),
        description: "Consulti clinici ricevuti e inviati tra professionisti.",
      },
      {
        href: "/professionisti/impostazioni",
        label: "Impostazioni",
        description: "Profilo, struttura e preferenze del portale.",
      },
    ],
    []
  );

  if (!authChecked) {
    return (
      <div data-pro-portal="true" className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="container-page px-3 py-10 sm:px-0">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-zinc-200/70" />
            <div className="mt-3 h-4 w-full max-w-xl rounded bg-zinc-200/50" />
            <div className="mt-1 h-4 w-full max-w-lg rounded bg-zinc-200/40" />
          </div>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="px-3 py-2 text-xs font-semibold tracking-[0.14em] text-zinc-500">
        AREA PROFESSIONISTI
      </div>

      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <SideLink
            key={`${it.href}:${String(typeof it.label === "string" ? it.label : it.href)}`}
            href={it.href}
            label={it.label}
            description={it.description}
          />
        ))}
      </div>

      <div className="mt-3 border-t border-zinc-200 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-black disabled:opacity-60"
        >
          {loggingOut ? "Uscita..." : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <div data-pro-portal="true" className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 px-3 py-3 sm:px-0 sm:py-4">
          <Link
            href="/professionisti/dashboard"
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
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60 lg:inline-flex"
            >
              {loggingOut ? "Uscita..." : "Logout"}
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-zinc-50 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Apri menu professionisti"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid grid-cols-1 gap-6 px-3 py-6 sm:px-0 sm:py-8 lg:grid-cols-[320px_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
            {sidebarContent}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      {open && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/30"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-0 top-0 z-50 h-full w-[92%] max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="text-sm font-semibold">Portale Professionisti</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Navigazione clinica dedicata
                </div>
              </div>

              <button
                type="button"
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold tracking-[0.14em] text-zinc-500">
                AREA PROFESSIONISTI
              </div>

              <div className="flex flex-col gap-1">
                {items.map((it) => (
                  <SideLink
                    key={`${it.href}:${String(typeof it.label === "string" ? it.label : it.href)}:mobile`}
                    href={it.href}
                    label={it.label}
                    description={it.description}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>

              <div className="mt-3 border-t border-zinc-200 pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-black disabled:opacity-60"
                >
                  {loggingOut ? "Uscita..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}