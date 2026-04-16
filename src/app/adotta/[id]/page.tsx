import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PageShell } from "@/_components/ui/page-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdoptionAnimal = {
  id: string;
  name: string | null;
  species: "dog" | "cat" | "other";
  status: string;
  shelter_id: string | null;
  shelter_type: "canile" | "gattile" | "rifugio" | null;
  city: string | null;
  province: string | null;
  breed_id: string | null;
  is_mixed: boolean | null;
  size: string | null;
  sex: string | null;
  age_months: number | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  good_with_kids: boolean | null;
  urgent: boolean | null;
  special_needs: boolean | null;
  photo_url: string | null;
  description: string | null;
  created_at: string | null;
};

type Shelter = {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
};

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Variabili Supabase mancanti.");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function speciesLabel(species: AdoptionAnimal["species"]) {
  if (species === "dog") return "Cane";
  if (species === "cat") return "Gatto";
  return "Altro animale";
}

function shelterTypeLabel(type: string | null) {
  if (type === "canile") return "Canile";
  if (type === "gattile") return "Gattile";
  if (type === "rifugio") return "Rifugio";
  return "Struttura";
}

function sexLabel(sex: string | null) {
  if (sex === "male") return "Maschio";
  if (sex === "female") return "Femmina";
  if (sex === "m") return "Maschio";
  if (sex === "f") return "Femmina";
  return "Non indicato";
}

function sizeLabel(size: string | null) {
  if (size === "small" || size === "s") return "Taglia piccola";
  if (size === "medium" || size === "m") return "Taglia media";
  if (size === "large" || size === "l") return "Taglia grande";
  return "Taglia non indicata";
}

function ageLabel(ageMonths: number | null) {
  if (ageMonths == null) return "EtÃ  non indicata";
  if (ageMonths < 12) return `${ageMonths} mesi`;
  const years = Math.floor(ageMonths / 12);
  const remainingMonths = ageMonths % 12;

  if (remainingMonths === 0) {
    return years === 1 ? "1 anno" : `${years} anni`;
  }

  return years === 1
    ? `1 anno e ${remainingMonths} mesi`
    : `${years} anni e ${remainingMonths} mesi`;
}

function CompatBadge({
  active,
  label,
}: {
  active: boolean | null;
  label: string;
}) {
  if (active !== true) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
      {label}
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return {
    title: `Adozione | ${id} | UNIMALIA`,
  };
}

export default async function AdottaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: animal, error } = await supabase
    .from("adoption_animals")
    .select("*")
    .eq("id", id)
    .maybeSingle<AdoptionAnimal>();

  if (error || !animal || animal.status !== "available") {
    notFound();
  }

  let shelter: Shelter | null = null;

  if (animal.shelter_id) {
    const { data: shelterData } = await supabase
      .from("shelters")
      .select("id,name,type,city")
      .eq("id", animal.shelter_id)
      .maybeSingle<Shelter>();

    shelter = shelterData ?? null;
  }

  const placeLabel = [animal.city, animal.province ? `(${animal.province})` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  const title = animal.name?.trim() || "Animale in adozione";

  return (
    <PageShell
      title={title}
      subtitle="Scheda pubblica dellâ€™animale in adozione."
      boxed
      backFallbackHref="/adotta"
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-zinc-100">
              <div className="aspect-[4/3] w-full">
                {animal.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={animal.photo_url}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm text-zinc-500">Nessuna foto disponibile</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {speciesLabel(animal.species)}
                </span>

                {animal.urgent ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Adozione urgente
                  </span>
                ) : null}

                {animal.special_needs ? (
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                    Bisogni speciali
                  </span>
                ) : null}

                {animal.is_mixed ? (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Meticcio
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                {title}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {placeLabel || "LocalitÃ  non indicata"}
                {shelter?.name ? ` Â· ${shelter.name}` : ""}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard label="EtÃ " value={ageLabel(animal.age_months)} />
                <InfoCard label="Sesso" value={sexLabel(animal.sex)} />
                <InfoCard label="Taglia" value={sizeLabel(animal.size)} />
                <InfoCard
                  label="Struttura"
                  value={shelter?.name || shelterTypeLabel(animal.shelter_type)}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <CompatBadge active={animal.good_with_dogs} label="Compatibile con cani" />
                <CompatBadge active={animal.good_with_cats} label="Compatibile con gatti" />
                <CompatBadge active={animal.good_with_kids} label="Compatibile con bambini" />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/adotta"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
                >
                  Torna alle adozioni
                </Link>

                <Link
                  href="/professionisti/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Contatta la struttura
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900">Descrizione</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700">
            {animal.description?.trim() || "Descrizione non disponibile."}
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900">Come funziona lâ€™adozione su UNIMALIA</h2>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">
            <p>
              Gli animali presenti in questa area vengono pubblicati dalle associazioni, non dai
              privati.
            </p>
            <p>
              Lâ€™associazione puÃ² creare gratuitamente lâ€™identitÃ  animale completa e, se il nuovo
              proprietario decide di continuare a usare UNIMALIA in versione Premium entro 15 giorni
              dal passaggio di proprietÃ , il primo anno da 6 euro viene riconosciuto allâ€™associazione.
            </p>
            <p>
              Questo aiuta a dare continuitÃ  allâ€™animale anche dopo lâ€™adozione, mantenendo piÃ¹
              ordinate le informazioni utili nel tempo.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}