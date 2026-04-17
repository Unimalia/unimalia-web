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
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
  owner_name: string | null;
  grant_status: "active" | "revoked_own_history" | "clinic_origin";
  has_active_grant: boolean;
  has_own_history: boolean;
};

function statusBadge(row: ManagedAnimalRow) {
  if (row.grant_status === "active") {
    return {
      label: "Grant attivo",
      className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    };
  }

  if (row.grant_status === "revoked_own_history") {
    return {
      label: "Grant revocato · vedi solo i tuoi dati",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    };
  }

  return {
    label: "Creato dalla clinica",
    className: "bg-sky-100 text-sky-800 border border-sky-200",
  };
}

function ownerBadge(row: ManagedAnimalRow) {
  if (row.owner_id) {
    return {
      label: "Proprietario collegato",
      className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    };
  }

  return {
    label: "Proprietario non collegato",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  };
}

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

  const clinicOriginCount = React.useMemo(
    () => initialRows.filter((row) => row.grant_status === "clinic_origin").length,
    [initialRows]
  );

  if (initialRows.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-6 text-sm leading-7 text-[#5f708a]">
        Nessun animale in gestione al momento.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <label className="block text-sm font-semibold text-[#30486f]">
            Cerca animale
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, specie, razza, microchip, codice UNIMALIA o proprietario"
            className="mt-1 w-full rounded-[1.2rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#30486f]"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              scope === "all"
                ? "bg-[#30486f] text-white shadow-[0_12px_24px_rgba(48,72,111,0.18)]"
                : "border border-[#d7dfe9] bg-white text-[#30486f] hover:bg-[#f8fbff]"
            }`}
          >
            Tutti ({initialRows.length})
          </button>

          <button
            type="button"
            onClick={() => setScope("active")}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              scope === "active"
                ? "bg-[#30486f] text-white shadow-[0_12px_24px_rgba(48,72,111,0.18)]"
                : "border border-[#d7dfe9] bg-white text-[#30486f] hover:bg-[#f8fbff]"
            }`}
          >
            Grant attivo ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setScope("revoked")}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              scope === "revoked"
                ? "bg-[#30486f] text-white shadow-[0_12px_24px_rgba(48,72,111,0.18)]"
                : "border border-[#d7dfe9] bg-white text-[#30486f] hover:bg-[#f8fbff]"
            }`}
          >
            Grant revocato ({revokedCount})
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-[#f8fbff] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
            Totale visibile
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#30486f]">
            {rows.length}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5f708a]">
            Risultati attuali in base a ricerca e filtro selezionati.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
            Grant attivi
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#30486f]">
            {activeCount}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5f708a]">
            Animali su cui la struttura può lavorare con accesso attivo.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
            Origine clinica
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#30486f]">
            {clinicOriginCount}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5f708a]">
            Schede nate dalla tua clinica o ancora collegate al tuo lavoro storico.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
            Nessun risultato
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
            Nessun animale trovato con questa ricerca o con il filtro attivo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => {
            const grant = statusBadge(row);
            const owner = ownerBadge(row);

            return (
              <Link
                key={row.id}
                href={`/professionisti/animali/${row.id}`}
                className="rounded-[1.6rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_12px_30px_rgba(42,56,86,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fbfdff] hover:shadow-[0_18px_40px_rgba(42,56,86,0.08)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-xl font-semibold tracking-[-0.02em] text-[#30486f]">
                      {row.name || "Animale senza nome"}
                    </div>

                    <div className="mt-1 text-sm text-[#5f708a]">
                      {[row.species, row.breed].filter(Boolean).join(" • ") || "Specie non indicata"}
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[#5f708a] sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-[#30486f]">Microchip:</span>{" "}
                        {row.microchip || "—"}
                      </div>

                      <div>
                        <span className="font-semibold text-[#30486f]">UNIMALIA:</span>{" "}
                        {row.unimalia_code || "—"}
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-semibold text-[#30486f]">Proprietario:</span>{" "}
                        {row.owner_name || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${owner.className}`}
                    >
                      {owner.label}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${grant.className}`}
                    >
                      {grant.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}