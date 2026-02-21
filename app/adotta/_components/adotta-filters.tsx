// app/adotta/_components/adotta-filters.tsx
"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Species = "dog" | "cat" | "other";
type ShelterType = "canile" | "gattile" | "rifugio";

export function AdottaFilters({
  species,
  breeds,
  shelters,
  cities,
  isPending,
}: {
  species: Species;
  breeds: Array<{ id: string; name: string }>;
  shelters: Array<{ id: string; name: string; type: ShelterType; city: string | null }>;
  cities: string[];
  isPending: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const current = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? "";
    return {
      species: (get("species") as Species) || species,
      city: get("city"),
      shelterType: get("shelterType"),
      shelterId: get("shelterId"),
      breedId: get("breedId"),
      mixed: get("mixed"),
      size: get("size"),
      sex: get("sex"),
      age: get("age"),
      withDogs: get("withDogs"),
      withCats: get("withCats"),
      withKids: get("withKids"),
      urgent: get("urgent"),
      specialNeeds: get("specialNeeds"),
      hasPhoto: get("hasPhoto"),
    };
  }, [sp, species]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);

    if (key === "species") {
      params.delete("breedId");
      params.delete("mixed");
      params.delete("size");
      params.delete("age");
      params.delete("sex");
      params.delete("withDogs");
      params.delete("withCats");
      params.delete("withKids");
      params.delete("urgent");
      params.delete("specialNeeds");
      params.delete("hasPhoto");
    }

    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function resetAll() {
    startTransition(() => router.replace(`${pathname}?species=${species}`));
  }

  const sheltersFiltered = useMemo(() => {
    const t = current.shelterType as ShelterType | "";
    if (!t) return shelters;
    return shelters.filter((s) => s.type === t);
  }, [shelters, current.shelterType]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">Tipo animale</span>
          <div className="inline-flex overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            <button
              type="button"
              onClick={() => setParam("species", "dog")}
              className={[
                "px-3 py-2 text-sm font-medium",
                current.species === "dog" ? "bg-white text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
              aria-pressed={current.species === "dog"}
            >
              Cane
            </button>
            <button
              type="button"
              onClick={() => setParam("species", "cat")}
              className={[
                "px-3 py-2 text-sm font-medium",
                current.species === "cat" ? "bg-white text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
              aria-pressed={current.species === "cat"}
            >
              Gatto
            </button>
            <button
              type="button"
              onClick={() => setParam("species", "other")}
              className={[
                "px-3 py-2 text-sm font-medium",
                current.species === "other" ? "bg-white text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
              aria-pressed={current.species === "other"}
            >
              Altro
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs text-zinc-500">Risultati aggiornati automaticamente</p>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-zinc-700">Città</label>
          <select
            value={current.city}
            onChange={(e) => setParam("city", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Struttura</label>
          <select
            value={current.shelterType}
            onChange={(e) => setParam("shelterType", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            <option value="canile">Canile</option>
            <option value="gattile">Gattile</option>
            <option value="rifugio">Rifugio</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Nome struttura</label>
          <select
            value={current.shelterId}
            onChange={(e) => setParam("shelterId", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            {sheltersFiltered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.city ? ` — ${s.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Razza</label>
          <select
            value={current.breedId}
            onChange={(e) => setParam("breedId", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            {breeds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-zinc-700">Meticcio</label>
          <select
            value={current.mixed}
            onChange={(e) => setParam("mixed", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Indifferente</option>
            <option value="true">Solo meticci</option>
            <option value="false">Solo razza</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Taglia</label>
          <select
            value={current.size}
            onChange={(e) => setParam("size", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            <option value="s">Piccola</option>
            <option value="m">Media</option>
            <option value="l">Grande</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Età</label>
          <select
            value={current.age}
            onChange={(e) => setParam("age", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Tutte</option>
            <option value="0-2">0–2 anni</option>
            <option value="3-6">3–6 anni</option>
            <option value="7+">7+ anni</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Sesso</label>
          <select
            value={current.sex}
            onChange={(e) => setParam("sex", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Indifferente</option>
            <option value="m">Maschio</option>
            <option value="f">Femmina</option>
          </select>
        </div>

        <div className="lg:col-span-4">
          <div className="mt-1 flex flex-wrap gap-2">
            <FilterPill label="Compatibile con cani" value={current.withDogs} onChange={(v) => setParam("withDogs", v)} />
            <FilterPill label="Compatibile con gatti" value={current.withCats} onChange={(v) => setParam("withCats", v)} />
            <FilterPill label="Compatibile con bambini" value={current.withKids} onChange={(v) => setParam("withKids", v)} />
            <FilterPill label="Urgente" value={current.urgent} onChange={(v) => setParam("urgent", v)} />
            <FilterPill label="Bisogni speciali" value={current.specialNeeds} onChange={(v) => setParam("specialNeeds", v)} />
            <FilterPill label="Solo con foto" value={current.hasPhoto} onChange={(v) => setParam("hasPhoto", v)} />
            {isPending ? <span className="ml-1 text-xs text-zinc-500">Aggiornamento…</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const active = value === "true";
  return (
    <button
      type="button"
      onClick={() => onChange(active ? "" : "true")}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}