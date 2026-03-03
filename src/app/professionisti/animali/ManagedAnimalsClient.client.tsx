"use client";

import * as React from "react";
import Link from "next/link";

type ManagedAnimalRow = {
  animal_id: string;
  animal_name: string;
  species: string | null;
  microchip: string | null;
  owner_name: string | null;
  last_visit_at: string | null;
  next_reminder_at: string | null;
  status: string;
};

function normalizeForSearch(v: unknown) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(d);
}

function renderStatus(s: string) {
  const v = (s ?? "").toLowerCase();
  if (v === "active" || v === "attivo") return "Attivo";
  if (v === "inactive" || v === "inattivo") return "Inattivo";
  return s || "—";
}

export default function ManagedAnimalsClient({
  initialRows,
}: {
  initialRows: ManagedAnimalRow[];
}) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const nq = normalizeForSearch(q);
    if (!nq) return initialRows;

    return initialRows.filter((r) => {
      const hay = [
        r.animal_name,
        r.microchip,
        r.owner_name,
      ]
        .map(normalizeForSearch)
        .join(" | ");

      return hay.includes(nq);
    });
  }, [q, initialRows]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-3 border-b p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome animale, microchip o proprietario…"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none"
        />
        <div className="text-sm text-neutral-600 whitespace-nowrap">
          {filtered.length} / {initialRows.length}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50">
            <tr className="text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">Specie</th>
              <th className="p-3">Proprietario</th>
              <th className="p-3">Ultima visita</th>
              <th className="p-3">Prossimo richiamo</th>
              <th className="p-3">Stato</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.animal_id} className="border-t">
                <td className="p-3 font-medium">{r.animal_name}</td>
                <td className="p-3">{r.species ?? "—"}</td>
                <td className="p-3">{r.owner_name ?? "—"}</td>
                <td className="p-3">{formatDate(r.last_visit_at)}</td>
                <td className="p-3">{formatDate(r.next_reminder_at)}</td>
                <td className="p-3">{renderStatus(r.status)}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/professionisti/animali/${r.animal_id}`}
                    className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                  >
                    Apri
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr className="border-t">
                <td className="p-6 text-neutral-600" colSpan={7}>
                  Nessun animale trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}