"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function RichiediConsultoClient() {
  const sp = useSearchParams();
  const preAnimal = (sp.get("animal") || "").trim();

  const [professionalId, setProfessionalId] = useState((sp.get("pro") || "").trim());
  const [ownerName, setOwnerName] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [animalId, setAnimalId] = useState(preAnimal);
  const [message, setMessage] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const isEmergency = useMemo(() => emergencyCode.trim().length > 0, [emergencyCode]);
  const canSend = useMemo(() => animalId.trim().length >= 3 && professionalId.trim().length >= 10, [animalId, professionalId]);

  async function onSend() {
    setResult(null);
    setSending(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setSending(false);
      setResult("Devi essere loggato per inviare la richiesta.");
      return;
    }

    const res = await fetch("/api/consult-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        professionalId: professionalId.trim(),
        animalId: animalId.trim(),
        animalName: animalName.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        message: message.trim() || undefined,
        emergencyCode: emergencyCode.trim() || undefined,
      }),
    });

    const json = await res.json().catch(() => ({}));

    setSending(false);

    if (!res.ok) {
      setResult(json?.error || "Errore invio richiesta.");
      return;
    }

    setResult("Richiesta inviata ✅ (stato: In attesa)");
    setMessage("");
    setEmergencyCode("");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Richiedi consulto</h1>
        <p className="mt-2 text-sm text-zinc-600">
          La richiesta arriva al professionista in <span className="font-semibold">/professionisti/richieste</span>.
          Se hai un <span className="font-semibold">codice EMERGENZA</span>, passa i blocchi e viene mostrata per prima (resta “In attesa”).
        </p>

        <div className="mt-6 grid gap-3">
          <input
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            placeholder="ID professionista (per ora manuale) — es. uuid"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />

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
            placeholder="ID animale (obbligatorio)"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Messaggio (opzionale)"
            className="min-h-[96px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />

          <div className={cx("rounded-2xl border p-4", isEmergency ? "border-red-200 bg-red-50" : "border-zinc-200 bg-zinc-50")}>
            <div className="text-sm font-semibold text-zinc-900">Codice emergenza</div>
            <p className="mt-1 text-sm text-zinc-600">Te lo fornisce il professionista.</p>

            <input
              value={emergencyCode}
              onChange={(e) => setEmergencyCode(e.target.value)}
              placeholder="EMG-XXXX (opzionale)"
              className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold tracking-wider outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="button"
            disabled={!canSend || sending}
            onClick={onSend}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Invio…" : "Invia richiesta"}
          </button>

          {result ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
              {result}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={animalId ? `/identita/${encodeURIComponent(animalId)}` : "/identita"}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Torna alla scheda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}