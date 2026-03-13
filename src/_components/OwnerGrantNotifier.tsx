"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

type OwnerGrantNotifierProps = {
  pathname: string;
};

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

function labelDuration(d: Duration) {
  if (d === "24h") return "24 ore";
  if (d === "7d") return "7 giorni";
  if (d === "6m") return "6 mesi";
  return "Senza scadenza";
}

export default function OwnerGrantNotifier({ pathname }: OwnerGrantNotifierProps) {
  const [mounted, setMounted] = useState(false);

  const [ownerPending, setOwnerPending] = useState<PendingOwnerRequest[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerDuration, setOwnerDuration] = useState<Record<string, Duration>>({});
  const [ownerDismissedIds, setOwnerDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let alive = true;
    let intervalId: number | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

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

        if (!channel) {
          channel = supabase
            .channel(`owner-access-requests-${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "animal_access_requests",
                filter: `owner_id=eq.${user.id}`,
              },
              () => {
                void loadPendingOwnerRequests();
              }
            )
            .subscribe();
        }
      } finally {
        if (alive) setOwnerLoading(false);
      }
    }

    void loadPendingOwnerRequests();

    intervalId = window.setInterval(() => {
      void loadPendingOwnerRequests();
    }, 5000);

    return () => {
      alive = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (channel) {
        void supabase.removeChannel(channel);
      }
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

  if (!showOwnerPopup || !currentOwnerRequest) {
    return null;
  }

  return createPortal(
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
              ? currentOwnerRequest.requested_scope
                  .filter((x) => x === "read" || x === "write")
                  .map((x) => (x === "read" ? "lettura" : "modifica"))
                  .join(", ")
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
            disabled={ownerBusy || ownerLoading}
          >
            Rifiuta
          </button>

          <button
            type="button"
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => actOnOwnerRequest(currentOwnerRequest.id, "approve")}
            disabled={ownerBusy || ownerLoading}
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
  );
}