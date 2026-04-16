"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Species = "dog" | "cat" | "other";
type ShelterType = "canile" | "gattile" | "rifugio";

type BreedOption = {
  id: string;
  name: string;
};

export function AdottaFilters({
  species,
  breeds,
  shelters,
  cities,
  isPending,
}: {
  species: Species;
  breeds: BreedOption[];
  shelters: Array<{
    id: string;
    name: string;
    type: ShelterType;
    city: string | null;
  }>;
  cities: string[];
  isPending: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const breedBoxRef = useRef<HTMLDivElement | null>(null);

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

  const selectedBreed = useMemo(
    () => breeds.find((b) => b.id === current.breedId) ?? null,
    [breeds, current.breedId]
  );

  const [breedQuery, setBreedQuery] = useState("");
  const [breedOpen, setBreedOpen] = useState(false);

  const selectedBreedName = selectedBreed?.name ?? "";
  const breedInputValue = breedOpen ? breedQuery : selectedBreedName || breedQuery;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!breedBoxRef.current) return;
      if (!breedBoxRef.current.contains(event.target as Node)) {
        setBreedOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBreedOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      params.delete("shelterId");
      setBreedQuery("");
      setBreedOpen(false);
    }

    if (key === "shelterType") {
      params.delete("shelterId");
    }

    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function resetAll() {
    setBreedQuery("");
    setBreedOpen(false);
    startTransition(() => router.replace(`${pathname}?species=${species}`));
  }

  const sheltersFiltered = useMemo(() => {
    const t = current.shelterType as ShelterType | "";
    if (!t) return shelters;
    return shelters.filter((s) => s.type === t);
  }, [shelters, current.shelterType]);

  const filteredBreeds = useMemo(() => {
    const q = breedQuery.trim().toLowerCase();
    if (!q) return breeds.slice(0, 40);

    return breeds
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [breeds, breedQuery]);

  function selectBreed(breed: BreedOption) {
    setBreedQuery(breed.name);
    setBreedOpen(false);
    setParam("breedId", breed.id);
  }

  function clearBreed() {
    setBreedQuery("");
    setBreedOpen(false);
    setParam("breedId", "");
  }

  return (
    <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-sm font-semibold text-[#30486f]">Tipo animale</span>

          <div className="inline-flex overflow-hidden rounded-2xl border border-[#d7dfe9] bg-[#f4f7fb]">
            <button
              type="button"
              onClick={() => setParam("species", "dog")}
              className={[
                "px-4 py-2.5 text-sm font-semibold transition",
                current.species === "dog"
                  ? "bg-[#30486f] text-white"
                  : "text-[#5f708a] hover:bg-white hover:text-[#30486f]",
              ].join(" ")}
              aria-pressed={current.species === "dog"}
            >
              Cane
            </button>
            <button
              type="button"
              onClick={() => setParam("species", "cat")}
              className={[
                "px-4 py-2.5 text-sm font-semibold transition",
                current.species === "cat"
                  ? "bg-[#30486f] text-white"
                  : "text-[#5f708a] hover:bg-white hover:text-[#30486f]",
              ].join(" ")}
              aria-pressed={current.species === "cat"}
            >
              Gatto
            </button>
            <button
              type="button"
              onClick={() => setParam("species", "other")}
              className={[
                "px-4 py-2.5 text-sm font-semibold transition",
                current.species === "other"
                  ? "bg-[#30486f] text-white"
                  : "text-[#5f708a] hover:bg-white hover:text-[#30486f]",
              ].join(" ")}
              aria-pressed={current.species === "other"}
            >
              Altro
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs text-[#6f7d91]">Risultati aggiornati automaticamente</p>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center justify-center rounded-xl border border-[#d7dfe9] bg-white px-3 py-2 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Città
          </label>
          <select
            value={current.city}
            onChange={(e) => setParam("city", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
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
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Struttura
          </label>
          <select
            value={current.shelterType}
            onChange={(e) => setParam("shelterType", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
          >
            <option value="">Tutte</option>
            <option value="canile">Canile</option>
            <option value="gattile">Gattile</option>
            <option value="rifugio">Rifugio</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Nome struttura
          </label>
          <select
            value={current.shelterId}
            onChange={(e) => setParam("shelterId", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
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

        <div className="relative" ref={breedBoxRef}>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Razza
          </label>

          <input
            value={breedInputValue}
            onChange={(e) => {
              const nextValue = e.target.value;
              setBreedQuery(nextValue);
              setBreedOpen(true);

              if (!nextValue.trim()) {
                setParam("breedId", "");
              }
            }}
            onFocus={() => {
              setBreedQuery(selectedBreedName || breedQuery);
              setBreedOpen(true);
            }}
            placeholder="Cerca razza..."
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
          />

          {breedOpen && breedQuery.trim() ? (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-[#d7dfe9] bg-white shadow-[0_18px_40px_rgba(42,56,86,0.12)]">
              {filteredBreeds.length > 0 ? (
                filteredBreeds.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBreed(b)}
                    className="block w-full px-3 py-3 text-left text-sm text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    {b.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-[#6f7d91]">
                  Nessuna razza trovata
                </div>
              )}
            </div>
          ) : null}

          {current.breedId ? (
            <button
              type="button"
              onClick={clearBreed}
              className="mt-2 text-xs font-semibold text-[#5f708a] hover:text-[#30486f]"
            >
              Rimuovi razza selezionata
            </button>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Meticcio
          </label>
          <select
            value={current.mixed}
            onChange={(e) => setParam("mixed", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
          >
            <option value="">Indifferente</option>
            <option value="true">Solo meticci</option>
            <option value="false">Solo non meticci</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Taglia
          </label>
          <select
            value={current.size}
            onChange={(e) => setParam("size", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
          >
            <option value="">Tutte</option>
            <option value="s">Piccola</option>
            <option value="m">Media</option>
            <option value="l">Grande</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Età
          </label>
          <select
            value={current.age}
            onChange={(e) => setParam("age", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
          >
            <option value="">Tutte</option>
            <option value="0-2">0–2 anni</option>
            <option value="3-6">3–6 anni</option>
            <option value="7+">7+ anni</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55657d]">
            Sesso
          </label>
          <select
            value={current.sex}
            onChange={(e) => setParam("sex", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-3 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#2f69c7]"
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
            {isPending ? <span className="ml-1 text-xs text-[#6f7d91]">Aggiornamento…</span> : null}
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
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-[#30486f] bg-[#30486f] text-white"
          : "border-[#d7dfe9] bg-white text-[#4f6078] hover:border-[#bcc9d8] hover:bg-[#f8fbff]",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}