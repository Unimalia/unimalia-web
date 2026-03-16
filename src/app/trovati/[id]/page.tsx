import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type FoundEvent = {
  id: string;
  created_at: string;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  event_date: string;
  primary_photo_url: string | null;
  lat: number | null;
  lng: number | null;
  type: "found" | "sighted";
  contact_email: string | null;
  contact_phone: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TrovatoDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const item = data as FoundEvent;

  const img = item.primary_photo_url || "/placeholder-animal.jpg";

  const mapsUrl =
    item.lat != null && item.lng != null
      ? `https://www.google.com/maps?q=${item.lat},${item.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${item.city || ""} ${item.province || ""} Italia`.trim()
        )}`;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/trovati"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Torna a Trovati / Avvistati
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={img}
          alt={item.species}
          className="h-72 w-full object-cover sm:h-96"
        />

        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {item.species}
                {item.animal_name ? ` – ${item.animal_name}` : ""}
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {item.city} {item.province ? `(${item.province})` : ""}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Data evento: {new Date(item.event_date).toLocaleDateString("it-IT")}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800">
              {item.type === "found" ? "Animale trovato" : "Animale avvistato"}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Descrizione
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              {item.description || "Nessuna descrizione disponibile."}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Contatti</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {item.contact_email || "Non disponibile"}
                </p>
                <p>
                  <span className="font-medium">Telefono:</span>{" "}
                  {item.contact_phone || "Non disponibile"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Posizione</h3>
              <p className="mt-3 text-sm text-zinc-700">
                {item.city || "Località non disponibile"}{" "}
                {item.province ? `(${item.province})` : ""}
              </p>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Apri su Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}