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
      <div className="rounded-[1.8rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Errore nel caricamento: {errorMessage}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[1.8rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
        <p className="text-sm text-[#5f708a]">Caricamento risultati…</p>
      </div>
    );
  }

  if (!animals.length) {
    return (
      <div className="rounded-[1.8rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
        <p className="text-sm text-[#5f708a]">Nessun animale trovato con questi filtri.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5f708a]">
        <span className="font-semibold text-[#30486f]">{animals.length}</span> animali trovati
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((a) => (
          <Link
            key={a.id}
            href={`/adotta/${a.id}`}
            className="group overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
          >
            <div className="overflow-hidden">
              <div className="aspect-[16/10] w-full bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]">
                {a.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.photo_url}
                    alt={a.name ?? "Animale"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xs text-[#6f7d91]">Nessuna foto</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.02em] text-[#30486f]">
                      {a.name ?? "Senza nome"}
                      {a.urgent ? (
                        <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Urgente
                        </span>
                      ) : null}
                    </p>

                    <p className="mt-1 text-sm text-[#5f708a]">
                      {a.city ? a.city : "Città non indicata"}
                      {a.province ? ` (${a.province})` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{formatAge(a.age_months)}</Badge>
                  <Badge>{formatSex(a.sex)}</Badge>
                  <Badge>{formatSize(a.size)}</Badge>
                  {a.is_mixed ? <Badge>Meticcio</Badge> : null}
                </div>

                {a.shelters?.name ? (
                  <p className="mt-4 text-xs text-[#6f7d91]">Struttura: {a.shelters.name}</p>
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
    <span className="inline-flex items-center rounded-full border border-[#d7dfe9] bg-white px-2.5 py-1 text-xs font-semibold text-[#4f6078]">
      {children}
    </span>
  );
}