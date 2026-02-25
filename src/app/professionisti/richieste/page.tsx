"use client";

import React, { useMemo, useState } from "react";

type Status = "pending" | "accepted" | "rejected" | "expired";

type RequestItem = {
  id: string;
  createdAt: number;
  animalName: string;
  ownerName: string;
  status: Status;
  isEmergency?: boolean;
  note?: string;
};

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function statusLabel(s: Status) {
  switch (s) {
    case "pending":
      return "In attesa";
    case "accepted":
      return "Accettata";
    case "rejected":
      return "Rifiutata";
    case "expired":
      return "Scaduta";
  }
}

function statusPillClass(s: Status) {
  switch (s) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-900";
    case "expired":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function makeId() {
  return (crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2));
}

export default function ProfessionistiRichiestePage() {
  // UI-only: cap & blocco
  const [capEnabled, setCapEnabled] = useState(true);
  const [capValue, setCapValue] = useState(20);
  const [blocked, setBlocked] = useState(false);

  // UI-only: “codice emergenza” generato dal professionista (valido fino a scadenza)
  const [emergencyCode, setEmergencyCode] = useState<string | null>(null);
  const [emergencyUntil, setEmergencyUntil] = useState<number | null>(null);

  // UI-only: elenco richieste (mock per ora)
  const [items, setItems] = useState<RequestItem[]>(() => [
    {
      id: makeId(),
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
      animalName: "Milo",
      ownerName: "Giulia R.",
      status: "pending",
      note: "Controllo post-operatorio",
    },
    {
      id: makeId(),
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      animalName: "Luna",
      ownerName: "Marco P.",
      status: "accepted",
      note: "Interpretazione esami",
    },
    {
      id: makeId(),
      createdAt: Date.now() - 1000 * 60 * 60 * 36,
      animalName: "Kira",
      ownerName: "Sara L.",
      status: "rejected",
      note: "Richiesta generica",
    },
  ]);

  const [tab, setTab] = useState<Status>("pending");
  const [query, setQuery] = useState("");

  // UI-only: quick add (simula arrivo richiesta utente)
  const [newOwner, setNewOwner] = useState("");
  const [newAnimal, setNewAnimal] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newEmergencyInput, setNewEmergencyInput] = useState("");

  const now = Date.now();
  const emergencyActive = useMemo(() => {
    if (!emergencyCode || !emergencyUntil) return false;
    return emergencyUntil > now;
  }, [emergencyCode, emergencyUntil, now]);

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items]
  );

  const capReached = useMemo(() => {
    if (!capEnabled) return false;
    return pendingCount >= capValue;
  }, [capEnabled, pendingCount, capValue]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items
      .filter((i) => i.status === tab)
      .filter((i) => {
        if (!q) return true;
        return (
          i.animalName.toLowerCase().includes(q) ||
          i.ownerName.toLowerCase().includes(q)
        );
      });

    // Mostra emergenze per prime (sempre), poi ordine per data desc
    filtered.sort((a, b) => {
      const ae = a.isEmergency ? 1 : 0;
      const be = b.isEmergency ? 1 : 0;
      if (ae !== be) return be - ae;
      return b.createdAt - a.createdAt;
    });

    return filtered;
  }, [items, tab, query]);

  function generateEmergencyCode() {
    const code = "EMG-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    setEmergencyCode(code);
    // UI: valido 15 minuti
    setEmergencyUntil(Date.now() + 15 * 60 * 1000);
    return code;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  function canBypassBlockWithEmergency(input: string) {
    const x = input.trim().toUpperCase();
    if (!x) return false;
    if (!emergencyActive) return false;
    return x === emergencyCode;
  }

  function canAcceptNewRequest(isEmergency: boolean) {
    if (!blocked) return true;
    // Bloccato: passa solo se emergenza valida
    return isEmergency;
  }

  function onSimulateIncoming() {
    const ownerName = newOwner.trim() || "Proprietario";
    const animalName = newAnimal.trim() || "Animale";
    const note = newNote.trim();

    const emergencyOk = canBypassBlockWithEmergency(newEmergencyInput);
    const emergencyFlag = emergencyOk;

    // Se cap raggiunto o blocco attivo, lasciamo passare solo emergenza
    const blockedByCap = capReached && capEnabled;
    const blockedByToggle = blocked;

    if ((blockedByCap || blockedByToggle) && !emergencyFlag) {
      // UI-only: non inseriamo richiesta
      return;
    }

    const req: RequestItem = {
      id: makeId(),
      createdAt: Date.now(),
      ownerName,
      animalName,
      status: "pending",
      isEmergency: emergencyFlag,
      note: note || (emergencyFlag ? "EMERGENZA" : undefined),
    };

    // Inserisci in cima (e comunque sorting emergenze farà il resto)
    setItems((prev) => [req, ...prev]);

    setNewOwner("");
    setNewAnimal("");
    setNewNote("");
    setNewEmergencyInput("");
  }

  function setStatus(id: string, status: Status) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Richieste consulto</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Inbox tipo mail: richieste in attesa, accettate, rifiutate o scadute.
          Le richieste con <span className="font-semibold">EMERGENZA</span> vengono mostrate per prime.
        </p>
      </div>

      {/* CONTROLLI */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Stato richieste</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Filtra e gestisci le richieste in modo rapido.
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per animale o proprietario…"
              className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400 sm:w-80"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["pending", "accepted", "rejected", "expired"] as Status[]).map((s) => {
              const active = tab === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTab(s)}
                  className={cx(
                    "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                  )}
                >
                  {statusLabel(s)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
                Nessuna richiesta in questa sezione.
              </div>
            ) : (
              list.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-zinc-900">
                          {r.animalName}
                        </div>
                        <div className="text-xs text-zinc-600">• {r.ownerName}</div>

                        {r.isEmergency ? (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                            EMERGENZA
                          </span>
                        ) : null}

                        <span
                          className={cx(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            statusPillClass(r.status)
                          )}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </div>

                      {r.note ? (
                        <p className="mt-2 text-sm text-zinc-700">{r.note}</p>
                      ) : null}

                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(r.createdAt).toLocaleString("it-IT")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {r.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setStatus(r.id, "accepted")}
                            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                          >
                            Accetta
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(r.id, "rejected")}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                          >
                            Rifiuta
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(r.id, "expired")}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                          >
                            Scade
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(r.id, "pending")}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        >
                          Rimetti in attesa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Controllo carico</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Imposta un limite e blocca nuove richieste. Le emergenze (con codice valido) passano e vengono mostrate per prime.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-zinc-800">Limite richieste in attesa</span>
              <input
                type="number"
                min={1}
                max={999}
                value={capValue}
                onChange={(e) => setCapValue(Number(e.target.value || 0))}
                className="h-10 w-24 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none focus:border-zinc-400"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-700">Limite attivo</span>
              <input
                type="checkbox"
                checked={capEnabled}
                onChange={(e) => setCapEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-700">Blocca nuove richieste</span>
              <input
                type="checkbox"
                checked={blocked}
                onChange={(e) => setBlocked(e.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-700">In attesa</span>
                <span className="font-semibold text-zinc-900">{pendingCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-zinc-700">Stato limite</span>
                <span className={cx("font-semibold", capReached ? "text-red-700" : "text-emerald-700")}>
                  {capReached ? "Raggiunto" : "OK"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-5">
            <h4 className="text-sm font-semibold text-zinc-900">Codice emergenza</h4>
            <p className="mt-2 text-sm text-zinc-600">
              Genera un codice temporaneo da dare al proprietario. Se inserito correttamente, la richiesta passa i blocchi e viene mostrata per prima.
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const c = generateEmergencyCode();
                  copy(c);
                }}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Genera e copia codice
              </button>

              {emergencyCode ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-700">Codice</div>
                  <div className="mt-1 text-lg font-bold tracking-wider">{emergencyCode}</div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {emergencyActive && emergencyUntil
                      ? `Valido fino a: ${new Date(emergencyUntil).toLocaleTimeString("it-IT")}`
                      : "Scaduto"}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* SIMULATORE ARRIVO (UI-only) */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Simula arrivo richiesta (UI)</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Questo box è solo per test UI finché non colleghiamo backend. Se limite/blocco sono attivi,
          passa solo con codice emergenza valido.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="Nome proprietario"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={newAnimal}
            onChange={(e) => setNewAnimal(e.target.value)}
            placeholder="Nome animale"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Nota (opzionale)"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400 md:col-span-2"
          />
          <input
            value={newEmergencyInput}
            onChange={(e) => setNewEmergencyInput(e.target.value)}
            placeholder="Codice emergenza (opzionale)"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="button"
            onClick={onSimulateIncoming}
            className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Inserisci richiesta
          </button>
        </div>

        {(blocked || (capEnabled && capReached)) ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Il professionista sta limitando nuove richieste.
            Solo le richieste con <span className="font-semibold">codice EMERGENZA</span> passano.
          </div>
        ) : null}
      </section>
    </div>
  );
}