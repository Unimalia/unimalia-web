"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProfessionistiBrand } from "./ProfessionistiBrand";
import ConsultsSidebarBadge from "./ConsultsSidebarBadge";
import { supabase } from "@/lib/supabaseClient";
import {
  activateOperatorSession,
  getOperatorSessionCurrent,
  heartbeatOperatorSession,
  logoutOperatorSession,
  setMyOperatorPin,
  switchOperatorSession,
  type OperatorOption,
  type OperatorSession,
} from "@/lib/client/operatorSession";

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

type ProUserLike = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function getEmail(u: ProUserLike | null | undefined) {
  return String(u?.email || "").toLowerCase().trim();
}

export function isProfessionalUser(u: ProUserLike | null | undefined) {
  if (!u) return false;
  return Boolean(u?.app_metadata?.is_professional || u?.user_metadata?.is_professional);
}

export function isVetUser(u: ProUserLike | null | undefined) {
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

function getOrCreateWorkstationKey() {
  if (typeof window === "undefined") return "";
  const storageKey = "unimalia:clinic:workstation";
  const existing = window.localStorage.getItem(storageKey);
  if (existing && existing.trim()) return existing.trim();

  const generated = `ws-${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUserIsVet, setCurrentUserIsVet] = useState(false);

  const [workstationKey, setWorkstationKey] = useState("");
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(null);
  const [availableOperators, setAvailableOperators] = useState<OperatorOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserClinicOperatorId, setCurrentUserClinicOperatorId] = useState<string | null>(
    null
  );
  const [currentUserHasPin, setCurrentUserHasPin] = useState(false);

  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [operatorPin, setOperatorPin] = useState("");
  const [operatorPinForMe, setOperatorPinForMe] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<string | null>(null);

  const isPublicProfessionistiPage =
    pathname === "/professionisti" || pathname === "/professionisti/login";

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
      if (isPublicProfessionistiPage) {
        if (alive) setAuthChecked(true);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      const msg = error instanceof Error ? error.message : "";

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

      setCurrentUserIsVet(isVetUser(user));
      setCurrentUserId(user.id);
      setWorkstationKey(getOrCreateWorkstationKey());
      setAuthChecked(true);
    }

    void check();

    return () => {
      alive = false;
    };
  }, [router, pathname, isPublicProfessionistiPage]);

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

  useEffect(() => {
    if (!authChecked || !workstationKey || isPublicProfessionistiPage) return;

    let alive = true;

    async function loadOperatorState() {
      try {
        const data = await getOperatorSessionCurrent(workstationKey);
        if (!alive) return;

        setOperatorSession(data.session);
        setAvailableOperators(data.availableOperators ?? []);
        setCurrentUserId(data.currentUserId ?? null);
        setCurrentUserClinicOperatorId(data.currentUserClinicOperatorId ?? null);
        setCurrentUserHasPin(Boolean(data.currentUserHasPin));

        if (!selectedOperatorId) {
          const defaultOperatorId =
            data.session?.activeClinicOperatorId ||
            data.currentUserClinicOperatorId ||
            data.availableOperators?.[0]?.clinicOperatorId ||
            "";

          setSelectedOperatorId(defaultOperatorId);
        }
      } catch {
        if (!alive) return;
        setOperatorSession(null);
        setAvailableOperators([]);
      }
    }

    void loadOperatorState();

    return () => {
      alive = false;
    };
  }, [authChecked, workstationKey, isPublicProfessionistiPage, selectedOperatorId]);

  useEffect(() => {
    if (!authChecked || !workstationKey || isPublicProfessionistiPage) return;

    const interval = window.setInterval(async () => {
      try {
        const result = await heartbeatOperatorSession(workstationKey);
        setOperatorSession(result.session);
      } catch {
        setOperatorSession(null);
      }
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, [authChecked, workstationKey, isPublicProfessionistiPage]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      if (workstationKey) {
        try {
          await logoutOperatorSession(workstationKey);
        } catch {
          // ignore
        }
      }

      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      setOpen(false);
      router.replace("/professionisti/login");
    }
  }

  async function refreshOperatorState() {
    if (!workstationKey) return;

    const data = await getOperatorSessionCurrent(workstationKey);
    setOperatorSession(data.session);
    setAvailableOperators(data.availableOperators ?? []);
    setCurrentUserId(data.currentUserId ?? null);
    setCurrentUserClinicOperatorId(data.currentUserClinicOperatorId ?? null);
    setCurrentUserHasPin(Boolean(data.currentUserHasPin));

    if (!selectedOperatorId) {
      const defaultOperatorId =
        data.session?.activeClinicOperatorId ||
        data.currentUserClinicOperatorId ||
        data.availableOperators?.[0]?.clinicOperatorId ||
        "";

      setSelectedOperatorId(defaultOperatorId);
    }
  }

  async function handleSaveMyPin() {
    if (!currentUserClinicOperatorId) {
      setOperatorError("Operatore clinico corrente non trovato.");
      return;
    }

    if (!operatorPinForMe.trim()) {
      setOperatorError("Inserisci un PIN.");
      return;
    }

    setOperatorLoading(true);
    setOperatorError(null);
    setOperatorInfo(null);

    try {
      await setMyOperatorPin(currentUserClinicOperatorId, operatorPinForMe);
      setOperatorPinForMe("");
      setCurrentUserHasPin(true);
      setOperatorInfo("PIN operatore salvato ✅");
      await refreshOperatorState();
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Errore salvataggio PIN.");
    } finally {
      setOperatorLoading(false);
    }
  }

  async function handleActivateOrSwitchOperator() {
    if (!workstationKey) {
      setOperatorError("Postazione non disponibile.");
      return;
    }

    if (!selectedOperatorId) {
      setOperatorError("Seleziona un operatore.");
      return;
    }

    if (!operatorPin.trim()) {
      setOperatorError("Inserisci il PIN operatore.");
      return;
    }

    setOperatorLoading(true);
    setOperatorError(null);
    setOperatorInfo(null);

    try {
      const response = operatorSession?.id
        ? await switchOperatorSession({
            workstationKey,
            clinicOperatorId: selectedOperatorId,
            pin: operatorPin,
          })
        : await activateOperatorSession({
            workstationKey,
            clinicOperatorId: selectedOperatorId,
            pin: operatorPin,
          });

      setOperatorSession(response.session);
      setOperatorPin("");
      setOperatorModalOpen(false);
      setOperatorInfo("Operatore attivo aggiornato ✅");
      await refreshOperatorState();
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Errore attivazione operatore.");
    } finally {
      setOperatorLoading(false);
    }
  }

  async function handleOperatorLogout() {
    if (!workstationKey) return;

    setOperatorLoading(true);
    setOperatorError(null);
    setOperatorInfo(null);

    try {
      await logoutOperatorSession(workstationKey);
      setOperatorSession(null);
      setOperatorInfo("Operatore disattivato.");
      await refreshOperatorState();
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Errore logout operatore.");
    } finally {
      setOperatorLoading(false);
    }
  }

  const items: Item[] = useMemo(() => {
    const baseItems: Item[] = [
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
    ];

    if (currentUserIsVet) {
      baseItems.push({
        href: "/professionisti/richieste",
        label: (
          <span className="inline-flex items-center">
            <span>Consulti</span>
            <ConsultsSidebarBadge />
          </span>
        ),
        description: "Consulti clinici ricevuti e inviati tra professionisti.",
      });

      baseItems.push({
        href: "/professionisti/agenda",
        label: "Agenda clinica",
        description: "Appuntamenti, stanze, turni e accesso rapido alla gestione veterinaria.",
      });
    }

    baseItems.push({
      href: "/professionisti/impostazioni",
      label: "Impostazioni",
      description: "Profilo, struttura e preferenze del portale.",
    });

    return baseItems;
  }, [currentUserIsVet]);

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

  if (isPublicProfessionistiPage) {
    return (
      <div data-pro-portal="true" className="min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="px-3 py-2 text-xs font-semibold tracking-[0.14em] text-zinc-500">
        AREA PROFESSIONISTI
      </div>

      <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Postazione condivisa
        </div>

        <div className="mt-2 text-sm font-semibold text-zinc-900">
          {operatorSession?.activeOperatorLabel || "Nessun operatore attivo"}
        </div>

        <div className="mt-1 text-xs text-zinc-600">
          {operatorSession?.activeOperatorRole || "Seleziona un operatore e attiva la sessione"}
        </div>

        {operatorSession?.activeOperatorIsVeterinarian ? (
          <div className="mt-1 text-[11px] text-zinc-500">
            FNOVI: {operatorSession.activeOperatorFnoviNumber || "—"}
            {operatorSession.activeOperatorFnoviProvince
              ? ` • ${operatorSession.activeOperatorFnoviProvince}`
              : ""}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setOperatorError(null);
              setOperatorInfo(null);
              setOperatorModalOpen(true);
            }}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            {operatorSession ? "Cambia operatore" : "Attiva operatore"}
          </button>

          {operatorSession ? (
            <button
              type="button"
              onClick={() => void handleOperatorLogout()}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              Disattiva
            </button>
          ) : null}
        </div>

        {!currentUserHasPin && currentUserClinicOperatorId ? (
          <div className="mt-4 border-t border-zinc-200 pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Imposta il tuo PIN
            </div>
            <input
              type="password"
              inputMode="numeric"
              value={operatorPinForMe}
              onChange={(e) => setOperatorPinForMe(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="4-8 cifre"
            />
            <button
              type="button"
              onClick={() => void handleSaveMyPin()}
              disabled={operatorLoading}
              className="mt-2 w-full rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {operatorLoading ? "Salvataggio..." : "Salva PIN"}
            </button>
          </div>
        ) : null}

        {operatorError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {operatorError}
          </div>
        ) : null}

        {operatorInfo ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {operatorInfo}
          </div>
        ) : null}
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
            {operatorSession ? (
              <div className="hidden rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 lg:block">
                Operatore attivo: {operatorSession.activeOperatorLabel}
              </div>
            ) : null}

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
                  Navigazione professionale dedicata
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

              <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Postazione condivisa
                </div>

                <div className="mt-2 text-sm font-semibold text-zinc-900">
                  {operatorSession?.activeOperatorLabel || "Nessun operatore attivo"}
                </div>

                <div className="mt-1 text-xs text-zinc-600">
                  {operatorSession?.activeOperatorRole || "Seleziona un operatore"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOperatorError(null);
                      setOperatorInfo(null);
                      setOperatorModalOpen(true);
                      setOpen(false);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    {operatorSession ? "Cambia operatore" : "Attiva operatore"}
                  </button>

                  {operatorSession ? (
                    <button
                      type="button"
                      onClick={() => void handleOperatorLogout()}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                      Disattiva
                    </button>
                  ) : null}
                </div>
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

      {operatorModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {operatorSession ? "Cambia operatore" : "Attiva operatore"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Seleziona l’operatore della postazione e conferma con PIN numerico.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900">Operatore</label>
                <select
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                >
                  <option value="">Seleziona operatore</option>
                  {availableOperators
                    .filter((operator) => operator.isActive)
                    .map((operator) => (
                      <option key={operator.clinicOperatorId} value={operator.clinicOperatorId}>
                        {operator.label}
                        {operator.role ? ` • ${operator.role}` : ""}
                        {operator.isVet && operator.fnoviNumber
                          ? ` • FNOVI ${operator.fnoviNumber}`
                          : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900">PIN operatore</label>
                <input
                  type="password"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={operatorPin}
                  onChange={(e) => setOperatorPin(e.target.value)}
                  placeholder="4-8 cifre"
                />
              </div>

              {operatorError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {operatorError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOperatorModalOpen(false);
                    setOperatorError(null);
                    setOperatorInfo(null);
                    setOperatorPin("");
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Chiudi
                </button>

                <button
                  type="button"
                  onClick={() => void handleActivateOrSwitchOperator()}
                  disabled={operatorLoading}
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {operatorLoading
                    ? "Verifica..."
                    : operatorSession
                      ? "Conferma cambio"
                      : "Attiva operatore"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}