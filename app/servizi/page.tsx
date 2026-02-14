import Link from "next/link";

const CATEGORIES = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensioni", label: "Pensioni" },
  { key: "pet-sitter", label: "Pet sitter" },
  { key: "addestramento", label: "Addestramento" },
  { key: "altro", label: "Altro" },
];

export default function ServiziPage() {
  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servizi</h1>
          <p className="mt-3 max-w-2xl text-zinc-700">
            Cerca professionisti e strutture per il tuo animale. Questa sezione è in costruzione:
            presto potrai filtrare per zona, categoria e recensioni.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:underline"
        >
          ← Home
        </Link>
      </div>

      {/* SEARCH BOX (placeholder UI già pronta) */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-900">
              Cosa stai cercando?
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Veterinario, pensione, toelettatura..."
              disabled
            />
            <p className="mt-2 text-xs text-zinc-500">
              (Ricerca attiva a breve)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900">
              Zona
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Firenze"
              disabled
            />
            <p className="mt-2 text-xs text-zinc-500">
              (Filtro zona in arrivo)
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">Categorie</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Seleziona una categoria per iniziare (attiveremo la ricerca man mano che inseriamo i professionisti).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-base font-semibold">{c.label}</p>
              <p className="mt-2 text-sm text-zinc-700">
                Presto disponibile
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FUTURA */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <p className="text-sm text-zinc-700">
          Sei un professionista? A breve attiveremo una piattaforma dedicata per pubblicare la tua scheda e gestire i servizi.
        </p>
      </div>
    </main>
  );
}
