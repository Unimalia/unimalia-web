"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProfessionistiBrand } from "./ProfessionistiBrand";
import ConsultsSidebarBadge from "./ConsultsSidebarBadge";
import { supabase } from "@/lib/supabaseClient";
import { getWorkstationKey } from "@/lib/client/workstationKey";
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
  id?: string | null;
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

function formatDateTimeIT(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUserIsVet, setCurrentUserIsVet] = useState(false);
  const [currentUser, setCurrentUser] = useState<ProUserLike | null>(null);

  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [workstationKey, setWorkstationKey] = useState("");
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(null);
  const [availableOperators, setAvailableOperators] = useState<OperatorOption[]>([]);
  const [selectedOperatorUserId, setSelectedOperatorUserId] = useState("");
  const [operatorPin, setOperatorPin] = useState("");
  const [pinSetupValue, setPinSetupValue] = useState("");
  const [pinSetupConfirm, setPinSetupConfirm] = useState("");
  const [currentUserHasPin, setCurrentUserHasPin] = useState(false);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorRefreshing, setOperatorRefreshing] = useState(false);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [pinSetupError, setPinSetupError] = useState<string | null>(null);
  const [pinSetupOk, setPinSetupOk] = useState<string | null>(null);

  const isPublicProfessionistiPage =
    pathname === "/professionisti" || pathname === "/professionisti/login";

  async function hardRedirectToLogin() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    router.replace(
      "/professionisti/login?next=" +
        encodeURIComponent(pathname || "/professionisti/dashboard")
    );
  }

  async function refreshOperatorSessionState(opts?: { silent?: boolean }) {
    if (isPublicProfessionistiPage) return;

    const wsKey = getWorkstationKey();
    if (!wsKey) return;

    if (!opts?.silent) {
      setOperatorRefreshing(true);
    }

    try {
      const data = await getOperatorSessionCurrent(wsKey);

      setWorkstationKey(data.workstationKey || wsKey);
      setOperatorSession(data.session || null);
      setAvailableOperators(Array.isArray(data.availableOperators) ? data.availableOperators : []);
      setCurrentUserHasPin(Boolean(data.currentUserHasPin));

      if (data.currentUserId && !selectedOperatorUserId) {
        setSelectedOperatorUserId(data.currentUserId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore sessione operatore.";
      setOperatorError(message);
    } finally {
      if (!opts?.silent) {
        setOperatorRefreshing(false);
      }
    }
  }

  useEffect(() => {
    let alive = true;

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

      setCurrentUser(user);
      setCurrentUserIsVet(isVetUser(user));
      setAuthChecked(true);

      const wsKey = getWorkstationKey();
      setWorkstationKey(wsKey);

      try {
        const operatorData = await getOperatorSessionCurrent(wsKey);
        if (!alive) return;

        setOperatorSession(operatorData.session || null);
        setAvailableOperators(
          Array.isArray(operatorData.availableOperators) ? operatorData.availableOperators : []
        );
        setCurrentUserHasPin(Boolean(operatorData.currentUserHasPin));
        setSelectedOperatorUserId(operatorData.currentUserId || user.id || "");
      } catch (operatorLoadError) {
        if (!alive) return;
        setOperatorError(
          operatorLoadError instanceof Error
            ? operatorLoadError.message
            : "Errore caricamento sessione operatore."
        );
      }
    }

    check();

    return () => {
      alive = false;
    };
  }, [router, pathname, isPublicProfessionistiPage]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setOperatorModalOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open && !operatorModalOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, operatorModalOpen]);

  useEffect(() => {
    if (!authChecked || isPublicProfessionistiPage || !workstationKey || !operatorSession?.id) {
      return;
    }

    const timer = window.setInterval(() => {
      void heartbeatOperatorSession(workstationKey)
        .then((data) => {
          setOperatorSession(data.session || null);
        })
        .catch(() => undefined);
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [authChecked, isPublicProfessionistiPage, workstationKey, operatorSession?.id]);

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

  async function handleActivateOperator(useSwitch: boolean) {
    if (!selectedOperatorUserId) {
      setOperatorError("Seleziona un operatore.");
      return;
    }

    if (!operatorPin.trim()) {
      setOperatorError("Inserisci il PIN.");
      return;
    }

    setOperatorLoading(true);
    setOperatorError(null);
    setPinSetupOk(null);

    try {
      const data = useSwitch
        ? await switchOperatorSession({
            workstationKey,
            targetUserId: selectedOperatorUserId,
            pin: operatorPin,
          })
        : await activateOperatorSession({
            workstationKey,
            targetUserId: selectedOperatorUserId,
            pin: operatorPin,
          });

      setOperatorSession(data.session);
      setOperatorPin("");
      await refreshOperatorSessionState({ silent: true });
    } catch (error) {
      setOperatorError(
        error instanceof Error ? error.message : "Errore attivazione operatore."
      );
    } finally {
      setOperatorLoading(false);
    }
  }

  async function handleLogoutOperatorSession() {
    if (!workstationKey) return;

    setOperatorLoading(true);
    setOperatorError(null);

    try {
      await logoutOperatorSession(workstationKey);
      setOperatorSession(null);
      setOperatorPin("");
      await refreshOperatorSessionState({ silent: true });
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : "Errore uscita operatore.");
    } finally {
      setOperatorLoading(false);
    }
  }

  async function handleSetPin() {
    const pin = pinSetupValue.trim();
    const confirm = pinSetupConfirm.trim();

    setPinSetupError(null);
    setPinSetupOk(null);

    if (!pin) {
      setPinSetupError("Inserisci il PIN.");
      return;
    }

    if (!/^\d{4,8}$/.test(pin)) {
      setPinSetupError("PIN non valido: usa 4-8 cifre numeriche.");
      return;
    }

    if (pin !== confirm) {
      setPinSetupError("I due PIN non coincidono.");
      return;
    }

    setOperatorLoading(true);

    try {
      await setMyOperatorPin(pin);
      setCurrentUserHasPin(true);
      setPinSetupValue("");
      setPinSetupConfirm("");
      setPinSetupOk("PIN operatore salvato.");
      await refreshOperatorSessionState({ silent: true });
    } catch (error) {
      setPinSetupError(error instanceof Error ? error.message : "Errore salvataggio PIN.");
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

  const currentOperatorLabel =
    operatorSession?.activeOperatorLabel?.trim() || "Operatore non attivo";

  const currentOperatorExpiryLabel = operatorSession?.expiresAt
    ? formatDateTimeIT(operatorSession.expiresAt)
    : "—";

  const sidebarContent = (
    <>
      <div className="px-3 py-2 text-xs font-semibold tracking-[0.14em] text-zinc-500">
        AREA PROFESSIONISTI
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            setOperatorModalOpen(true);
            setOpen(false);
            setOperatorError(null);
            setPinSetupError(null);
            setPinSetupOk(null);
          }}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left shadow-sm transition hover:bg-white"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Operatore attivo
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-900">
            {currentOperatorLabel}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {operatorSession?.id
              ? `PIN verificato • scade ${currentOperatorExpiryLabel}`
              : "Nessuna sessione operatore attiva"}
          </div>
        </button>
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
              onClick={() => {
                setOperatorModalOpen(true);
                setOperatorError(null);
                setPinSetupError(null);
                setPinSetupOk(null);
              }}
              className="hidden rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-white lg:inline-flex"
            >
              {operatorSession?.id ? `Operatore: ${currentOperatorLabel}` : "Attiva operatore"}
            </button>

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

              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setOperatorModalOpen(true);
                    setOpen(false);
                    setOperatorError(null);
                    setPinSetupError(null);
                    setPinSetupOk(null);
                  }}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left shadow-sm transition hover:bg-white"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Operatore attivo
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {currentOperatorLabel}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {operatorSession?.id
                      ? `PIN verificato • scade ${currentOperatorExpiryLabel}`
                      : "Nessuna sessione operatore attiva"}
                  </div>
                </button>
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

      {operatorModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 md:p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Postazione condivisa
                </div>
                <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                  Sessione operatore attivo
                </h2>
                <div className="mt-2 text-sm text-zinc-600">
                  Workstation: <span className="font-mono text-zinc-800">{workstationKey}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOperatorModalOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
              >
                Chiudi
              </button>
            </div>

            <div className="space-y-5 p-5 md:p-6">
              {operatorError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {operatorError}
                </div>
              ) : null}

              {pinSetupError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {pinSetupError}
                </div>
              ) : null}

              {pinSetupOk ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {pinSetupOk}
                </div>
              ) : null}

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Stato attuale
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="text-xs font-semibold text-zinc-500">Operatore attivo</div>
                    <div className="mt-2 text-sm font-semibold text-zinc-900">
                      {currentOperatorLabel}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="text-xs font-semibold text-zinc-500">Scadenza sessione</div>
                    <div className="mt-2 text-sm font-semibold text-zinc-900">
                      {currentOperatorExpiryLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void refreshOperatorSessionState()}
                    disabled={operatorRefreshing || operatorLoading}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {operatorRefreshing ? "Aggiornamento..." : "Aggiorna stato"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLogoutOperatorSession()}
                    disabled={operatorLoading || !operatorSession?.id}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-60"
                  >
                    Disattiva postazione
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Attiva / cambia operatore
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Operatore
                    </span>
                    <select
                      value={selectedOperatorUserId}
                      onChange={(e) => setSelectedOperatorUserId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Seleziona operatore</option>
                      {availableOperators.map((operator) => (
                        <option key={operator.userId} value={operator.userId}>
                          {operator.label}
                          {operator.isVet ? " • Vet" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      PIN numerico
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={operatorPin}
                      onChange={(e) => setOperatorPin(e.target.value.replace(/\D+/g, ""))}
                      placeholder="4-8 cifre"
                      className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleActivateOperator(false)}
                    disabled={operatorLoading}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900 disabled:opacity-60"
                  >
                    {operatorLoading ? "Attivazione..." : "Attiva operatore"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleActivateOperator(true)}
                    disabled={operatorLoading}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {operatorLoading ? "Cambio..." : "Cambia operatore"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Il tuo PIN operatore
                </div>

                <div className="mt-2 text-sm text-zinc-600">
                  Utente corrente:{" "}
                  <span className="font-semibold text-zinc-900">
                    {currentUser?.email || currentUser?.id || "—"}
                  </span>
                </div>

                <div className="mt-2 text-sm text-zinc-600">
                  Stato PIN:{" "}
                  <span className="font-semibold text-zinc-900">
                    {currentUserHasPin ? "Configurato" : "Non configurato"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Nuovo PIN
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={pinSetupValue}
                      onChange={(e) => setPinSetupValue(e.target.value.replace(/\D+/g, ""))}
                      placeholder="4-8 cifre"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Conferma PIN
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={pinSetupConfirm}
                      onChange={(e) => setPinSetupConfirm(e.target.value.replace(/\D+/g, ""))}
                      placeholder="Ripeti PIN"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void handleSetPin()}
                    disabled={operatorLoading}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {operatorLoading ? "Salvataggio..." : "Salva PIN"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}