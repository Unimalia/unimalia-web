"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function RichiediConsultoClient() {
  const sp = useSearchParams();
  const preAnimal = (sp.get("animal") || "").trim();

  const [ownerName, setOwnerName] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [animalId, setAnimalId] = useState(preAnimal);
  const [message, setMessage] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");

  const isEmergency = useMemo(() => emergencyCode.trim().length > 0, [emergencyCode]);
  const canSend = useMemo(() => animalId.trim().length >= 3, [animalId]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Richiedi consulto</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Invia una richiesta al professionista. Se hai un{" "}
          <span className="font-semibold">codice EMERGENZA</span>, la richiesta passa eventuali blocchi
          e viene mostrata per prima (resta comunque “In attesa”).
        </p>

        <div className="mt-6 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Tuo nome (opzionale)"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
              placeholder="Nome animale (opzionale)"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <input
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            placeholder="ID animale / codice identità (obbligatorio)"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Messaggio (opzionale). Es: 'È urgente, febbre alta da ieri...'"
            className="min-h-[96px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />

          <div
            className={cx(
              "rounded-2xl border p-4",
              isEmergency ? "border-red-200 bg-red-50" : "border-zinc-200 bg-zinc-50"
            )}
          >
            <div className="text-sm font-semibold text-zinc-900">Codice emergenza</div>
            <p className="mt-1 text-sm text-zinc-600">
              Te lo fornisce il professionista. Se presente, la richiesta viene evidenziata e mostrata per prima.
            </p>

            <input
              value={emergencyCode}
              onChange={(e) => setEmergencyCode(e.target.value)}
              placeholder="EMG-XXXX (opzionale)"
              className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold tracking-wider outline-none focus:border-zinc-400"
            />

            {isEmergency ? (
              <div className="mt-2 text-sm font-semibold text-red-800">Modalità EMERGENZA attiva</div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!canSend}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Invia richiesta (UI)
          </button>

          <div className="text-xs text-zinc-500">
            Nota: qui non stiamo ancora salvando nulla. È UI pronta per collegamento backend.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={animalId ? `/identita/${encodeURIComponent(animalId)}` : "/identita"}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Torna alla scheda
            </Link>
            <Link
              href="/professionisti/richieste"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Vai al portale (demo)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}