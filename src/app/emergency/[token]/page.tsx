import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublicEmergencyCardByToken } from "@/lib/emergency/public-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

function listOrDash(items: string[]) {
  return items.length > 0 ? items : ["—"];
}

export default async function EmergencyPublicPage({ params }: PageProps) {
  const { token } = await params;
  const h = await headers();

  const data = await getPublicEmergencyCardByToken(token, {
    requestPath: `/emergency/${token}`,
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null,
    userAgent: h.get("user-agent"),
    country: h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || null,
    requestId: h.get("x-request-id"),
  });

  if (!data) {
    notFound();
  }

  const allergies = listOrDash(data.clinical.allergies);
  const therapies = listOrDash(data.clinical.activeTherapies);
  const chronic = listOrDash(data.clinical.chronicPathologies);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900">
      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            {data.animal.photoUrl ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 sm:w-56">
                <img
                  src={data.animal.photoUrl}
                  alt={data.animal.name}
                  className="h-56 w-full object-contain"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                QR emergenza
              </div>

              <h1 className="mt-3 text-2xl font-semibold">{data.animal.name}</h1>

              <p className="mt-1 text-sm text-zinc-600">
                {data.animal.species}
                {data.animal.breed ? ` • ${data.animal.breed}` : ""}
              </p>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Colore</div>
                  <div className="mt-1 font-semibold">{data.animal.color || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Taglia</div>
                  <div className="mt-1 font-semibold">{data.animal.size || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Gruppo sanguigno</div>
                  <div className="mt-1 font-semibold">{data.clinical.bloodType || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Sterilizzato / castrato</div>
                  <div className="mt-1 font-semibold">
                    {data.clinical.sterilizationStatus || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-red-700">⚠️ Allergie</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800">
            {allergies.map((item, index) => (
              <li key={index} className="rounded-xl bg-red-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">💊 Terapie attive</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800">
            {therapies.map((item, index) => (
              <li key={index} className="rounded-xl bg-zinc-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">🩺 Patologie croniche</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-800">
            {chronic.map((item, index) => (
              <li key={index} className="rounded-xl bg-zinc-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="px-1 text-xs text-zinc-500">
          Informazioni di emergenza a consultazione rapida. Questa vista pubblica non sostituisce
          la cartella clinica completa.
        </p>
      </div>
    </main>
  );
}