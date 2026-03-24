"use client";

import Link from "next/link";
import React from "react";

type ManagedAnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  microchip: string | null;
  unimalia_code: string | null;
  owner_id: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
  created_by_org_id: string | null;
  origin_org_id: string | null;
  owner_name: string | null;
  grant_status: "active" | "revoked_own_history" | "clinic_origin";
  has_active_grant: boolean;
  has_own_history: boolean;
};

export default function ManagedAnimalsClient({
  initialRows,
  initialQuery,
}: {
  initialRows: ManagedAnimalRow[];
  initialQuery: string;
}) {
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [scope, setScope] = React.useState<"all" | "active" | "revoked">("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return initialRows.filter((row) => {
      const matchesQuery =
        !q ||
        (row.name ?? "").toLowerCase().includes(q) ||
        (row.species ?? "").toLowerCase().includes(q) ||
        (row.breed ?? "").toLowerCase().includes(q) ||
        (row.microchip ?? "").toLowerCase().includes(q) ||
        (row.unimalia_code ?? "").toLowerCase().includes(q) ||
        (row.owner_name ?? "").toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (scope === "active") {
        return row.grant_status === "active";
      }

      if (scope === "revoked") {
        return row.grant_status === "revoked_own_history";
      }

      return true;
    });
  }, [initialRows, query, scope]);

  const activeCount = React.useMemo(
    () => initialRows.filter((row) => row.grant_status === "active").length,
    [initialRows]
  );

  const revokedCount = React.useMemo(
    () => initialRows.filter((row) => row.grant_status === "revoked_own_history").length,
    [initialRows]
  );

  if (initialRows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Nessun animale in gestione al momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, specie, razza, microchip, codice UNIMALIA o proprietario"
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              scope === "all"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800"
            }`}
          >
            Tutti
          </button>

          <button
            type="button"
            onClick={() => setScope("active")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              scope === "active"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800"
            }`}
          >
            Grant attivo ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setScope("revoked")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              scope === "revoked"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800"
            }`}
          >
            Grant revocato ({revokedCount})
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Nessun animale trovato con questa ricerca.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/professionisti/animali/${row.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-zinc-900">
                    {row.name || "Animale senza nome"}
                  </div>

                  <div className="mt-1 text-sm text-zinc-600">
                    {[row.species, row.breed].filter(Boolean).join(" • ") || "—"}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-zinc-500">
                    <div>Microchip: {row.microchip || "—"}</div>
                    {row.unimalia_code ? <div>UNIMALIA: {row.unimalia_code}</div> : null}
                    <div>Proprietario: {row.owner_name || "—"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {row.owner_id ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      Proprietario collegato
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Proprietario non collegato
                    </span>
                  )}

                  {row.grant_status === "active" ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      Grant attivo
                    </span>
                  ) : null}

                  {row.grant_status === "revoked_own_history" ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Grant revocato · vedi solo i tuoi dati
                    </span>
                  ) : null}

                  {row.grant_status === "clinic_origin" ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                      Creato dalla clinica
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}