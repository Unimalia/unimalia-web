"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import AuthButtons from "./AuthButtons";
import { supabase } from "@/lib/supabaseClient";

type NavItem = { href: string; label: string };

type PendingOwnerRequest = {
  id: string;
  created_at: string;
  animal_id: string;
  org_id: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "revoked" | string;
  requested_scope?: string[] | null;
  expires_at?: string | null;
  animal_name?: string | null;
  org_name?: string | null;
};

type Duration = "24h" | "7d" | "6m" | "forever";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function labelDuration(d: Duration) {
  if (d === "24h") return "24 ore";
  if (d === "7d") return "7 giorni";
  if (d === "6m") return "6 mesi";
  return "Senza scadenza";
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
        "relative inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
        fullWidth && "w-full justify-start",
        active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
      )}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [ownerPending, setOwnerPending] = useState<PendingOwnerRequest[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerDuration, setOwnerDuration] = useState<Record<string, Duration>>({});
  const [ownerDismissedIds, setOwnerDismissedIds] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

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
      { href: "/identita", label: "Identità animale" },
      { href: "/smarrimenti/nuovo", label: "Pubblica smarrimento" },
    ],
    []
  );

  const proHref = "/professionisti/dashboard";

  useEffect(() => {
    let alive = true;

    async function loadPendingOwnerRequests() {
      if (pathname.startsWith("/professionisti")) {
        if (alive) setOwnerPending([]);
        return;
      }

      setOwnerLoading(true);

      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!alive) return;

        if (!user) {
          setOwnerPending([]);
          return;
        }

        const res = await fetch("/api/owner/access-requests", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setOwnerPending([]);
          return;
        }

        const rows = ((json.rows ?? []) as PendingOwnerRequest[]).filter(
          (r) => r.status === "pending" && !ownerDismissedIds.includes(r.id)
        );

        setOwnerPending(rows);

        setOwnerDuration((prev) => {
          const next = { ...prev };
          for (const row of rows) {
            if (!next[row.id]) next[row.id] = "7d";
          }
          return next;
        });
      } finally {
        if (alive) setOwnerLoading(false);
      }
    }

    void loadPendingOwnerRequests();
    const interval = window.setInterval(() => {
      void loadPendingOwnerRequests();
    }, 5000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [pathname, ownerDismissedIds]);

  async function actOnOwnerRequest(id: string, action: "approve" | "reject") {
    const selectedDuration = ownerDuration[id] ?? "7d";
    setOwnerBusy(true);

    try {
      const res = await fetch("/api/owner/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          duration: action === "approve" ? selectedDuration : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Operazione non riuscita");
        return;
      }

      setOwnerPending((prev) => prev.filter((r) => r.id !== id));
      setOwnerDismissedIds((prev) => prev.filter((x) => x !== id));
    } finally {
      setOwnerBusy(false);
    }
  }

  function dismissOwnerPopup(id: string) {
    setOwnerDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setOwnerPending((prev) => prev.filter((r) => r.id !== id));
  }

  const currentOwnerRequest = ownerPending[0] ?? null;
  const showOwnerPopup =
    mounted &&
    !!currentOwnerRequest &&
    !pathname.startsWith("/professionisti") &&
    !pathname.startsWith("/login");

  const mobileDrawer =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[1000] md:hidden">
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/30"
              aria-label="Chiudi menu"
              onClick={() => setOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-zinc-200 bg-white shadow-2xl">
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
                <div className="flex flex-col gap-1 px-2">
                  {nav.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      onClick={() => setOpen(false)}
                      fullWidth
                    />
                  ))}
                </div>

                <div className="mt-4 border-t border-zinc-200 px-4 pt-4">
                  <Link
                    href={proHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
                  >
                    Professionisti
                  </Link>

                  <div className="mt-3">
                    <AuthButtons onNavigate={() => setOpen(false)} />
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const ownerPopup =
    showOwnerPopup && currentOwnerRequest
      ? createPortal(
          <div className="fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-md">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-zinc-500">
                    RICHIESTA IN ARRIVO
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                    Autorizza accesso professionista
                  </h3>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  onClick={() => dismissOwnerPopup(currentOwnerRequest.id)}
                  disabled={ownerBusy}
                >
                  Chiudi
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="text-zinc-900">
                  <span className="font-semibold">Animale:</span>{" "}
                  {currentOwnerRequest.animal_name ?? currentOwnerRequest.animal_id}
                </div>
                <div className="text-zinc-900">
                  <span className="font-semibold">Professionista:</span>{" "}
                  {currentOwnerRequest.org_name ?? currentOwnerRequest.org_id}
                </div>
                <div className="text-zinc-600">
                  Permessi richiesti:{" "}
                  {currentOwnerRequest.requested_scope?.length
                    ? currentOwnerRequest.requested_scope.join(", ")
                    : "accesso base"}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                <label className="block text-sm font-medium text-zinc-900">
                  Durata autorizzazione
                </label>
                <select
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  value={ownerDuration[currentOwnerRequest.id] ?? "7d"}
                  onChange={(e) =>
                    setOwnerDuration((prev) => ({
                      ...prev,
                      [currentOwnerRequest.id]: e.target.value as Duration,
                    }))
                  }
                  disabled={ownerBusy}
                >
                  <option value="24h">{labelDuration("24h")}</option>
                  <option value="7d">{labelDuration("7d")}</option>
                  <option value="6m">{labelDuration("6m")}</option>
                  <option value="forever">{labelDuration("forever")}</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                  onClick={() => actOnOwnerRequest(currentOwnerRequest.id, "reject")}
                  disabled={ownerBusy}
                >
                  Rifiuta
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => actOnOwnerRequest(currentOwnerRequest.id, "approve")}
                  disabled={ownerBusy}
                >
                  {ownerBusy ? "Attendi..." : "Approva accesso"}
                </button>

                <Link
                  href="/profilo/richieste-accesso"
                  className="inline-flex items-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Apri tutte le richieste
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-4 sm:py-5 pl-2 sm:pl-4">
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

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
            <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto whitespace-nowrap">
              {nav.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>

            <Link
              href={proHref}
              className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Professionisti
            </Link>

            <AuthButtons />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={proHref}
              className="inline-flex items-center justify-center rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Professionisti
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
      </header>

      {mobileDrawer}
      {ownerPopup}

      <main className="container-page py-8 sm:py-10">{children}</main>

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