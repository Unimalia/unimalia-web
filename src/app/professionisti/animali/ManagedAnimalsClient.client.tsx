"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function tokenize(q: string) {
  // split per spazi + punteggiatura, rimuove token vuoti e token da 1 carattere (troppi falsi positivi)
  return normalizeForSearch(q)
    .split(/[\s,.;:_\-+/\\|(){}\[\]"'’]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 2);
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

function shortId(id: string) {
  const v = String(id || "");
  if (v.length <= 8) return v;
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function renderMicrochip(m: string | null) {
  const v = (m ?? "").trim();
  if (!v) return "—";
  // se è lungo, mostra finale (comodo per distinzione senza “rumore”)
  if (v.length > 10) return `…${v.slice(-6)}`;
  return v;
}

export default function ManagedAnimalsClient({
  initialRows,
  initialQuery,
}: {
  initialRows: ManagedAnimalRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(initialQuery || "");

  const filtered = React.useMemo(() => {
    const tokens = tokenize(q);
    if (tokens.length === 0) return initialRows;

    return initialRows.filter((r) => {
      const hay = [
        r.animal_name,
        r.owner_name,
        r.species,
        r.microchip,
        r.animal_id,
      ]
        .map(normalizeForSearch)
        .join(" | ");

      // AND: tutte le parole devono comparire da qualche parte
      return tokens.every((t) => hay.includes(t));
    });
  }, [q, initialRows]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-3 border-b p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca: nome animale, proprietario, specie, microchip… (es. “zara panella cane”)"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none"
        />

        <button
          onClick={() => router.push(`/professionisti/animali?q=${encodeURIComponent(q)}`)}
          className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
          title="Ricarica la pagina con query (utile se hai migliaia di righe)"
        >
          Cerca
        </button>

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
              <th className="p-3">Microchip</th>
              <th className="p-3">Ultima visita</th>
              <th className="p-3">Prossimo richiamo</th>
              <th className="p-3">Stato</th>
              <th className="p-3">ID</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.animal_id} className="border-t">
                <td className="p-3 font-medium">{r.animal_name}</td>
                <td className="p-3">{r.species ?? "—"}</td>
                <td className="p-3">{r.owner_name ?? "—"}</td>
                <td className="p-3">{renderMicrochip(r.microchip)}</td>
                <td className="p-3">{formatDate(r.last_visit_at)}</td>
                <td className="p-3">{formatDate(r.next_reminder_at)}</td>
                <td className="p-3">{renderStatus(r.status)}</td>
                <td className="p-3 font-mono text-xs opacity-80">{shortId(r.animal_id)}</td>
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
                <td className="p-6 text-neutral-600" colSpan={9}>
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