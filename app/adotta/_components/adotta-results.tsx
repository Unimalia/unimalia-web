// app/adotta/_components/adotta-results.tsx
import Link from "next/link";

type ShelterType = "canile" | "gattile" | "rifugio";

type Animal = {
  id: string;
  name: string | null;
  species: "dog" | "cat" | "other";
  city: string | null;
  province: string | null;
  age_months: number | null;
  sex: "m" | "f" | null;
  size: "s" | "m" | "l" | null;
  is_mixed: boolean | null;
  photo_url: string | null;
  urgent: boolean | null;
  shelters?: {
    id: string;
    name: string | null;
    type: ShelterType | null;
    city: string | null;
  } | null;
};

function formatAge(ageMonths: number | null) {
  if (ageMonths == null) return "Età non indicata";
  if (ageMonths < 12) return `${ageMonths} mesi`;
  const years = Math.floor(ageMonths / 12);
  return years === 1 ? "1 anno" : `${years} anni`;
}

function formatSex(sex: Animal["sex"]) {
  if (sex === "m") return "Maschio";
  if (sex === "f") return "Femmina";
  return "Sesso non indicato";
}

function formatSize(size: Animal["size"]) {
  if (size === "s") return "Taglia piccola";
  if (size === "m") return "Taglia media";
  if (size === "l") return "Taglia grande";
  return "Taglia non indicata";
}

export function AdottaResults({
  animals,
  loading,
  errorMessage,
}: {
  animals: Animal[];
  loading: boolean;
  errorMessage: string;
}) {
  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Errore nel caricamento: {errorMessage}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento risultati…</p>
      </div>
    );
  }

  if (!animals.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Nessun animale trovato con questi filtri.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">{animals.length}</span> animali trovati
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((a) => (
          <Link
            key={a.id}
            href={`/adotta/${a.id}`}
            className="group rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300"
          >
            <div className="overflow-hidden rounded-2xl">
              <div className="aspect-[16/10] w-full bg-zinc-100">
                {a.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photo_url} alt={a.name ?? "Animale"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xs text-zinc-500">Nessuna foto</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">
                      {a.name ?? "Senza nome"}
                      {a.urgent ? (
                        <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Urgente
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {a.city ? a.city : "Città non indicata"}
                      {a.province ? ` (${a.province})` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{formatAge(a.age_months)}</Badge>
                  <Badge>{formatSex(a.sex)}</Badge>
                  <Badge>{formatSize(a.size)}</Badge>
                  {a.is_mixed ? <Badge>Meticcio</Badge> : null}
                </div>

                {a.shelters?.name ? (
                  <p className="mt-3 text-xs text-zinc-500">Struttura: {a.shelters.name}</p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}