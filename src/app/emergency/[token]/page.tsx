import Image from "next/image";
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

type EmergencyLang = "it" | "en";

const DICT = {
  it: {
    badge: "QR emergenza",
    color: "Colore",
    size: "Taglia",
    blood: "Gruppo sanguigno",
    sterilized: "Sterilizzato / castrato",
    allergies: "Allergie",
    therapies: "Terapie attive",
    chronic: "Patologie croniche",
    ownerName: "Nome proprietario",
    ownerPhone: "Telefono proprietario",
    notes: "Note emergenza",
    subtitle:
      "Informazioni di emergenza a consultazione rapida. Questa vista pubblica non sostituisce la cartella clinica completa.",
    notAvailable: "Non rilevato",
  },
  en: {
    badge: "Emergency QR",
    color: "Color",
    size: "Size",
    blood: "Blood type",
    sterilized: "Sterilized / neutered",
    allergies: "Allergies",
    therapies: "Active therapies",
    chronic: "Chronic conditions",
    ownerName: "Owner name",
    ownerPhone: "Owner phone",
    notes: "Emergency notes",
    subtitle:
      "Rapid emergency information. This public view does not replace the full medical record.",
    notAvailable: "Not available",
  },
};

function listOrDash(items: string[]) {
  return items.length > 0 ? items : ["â€”"];
}

function detectLanguage(acceptLanguage: string | null): EmergencyLang {
  const raw = String(acceptLanguage ?? "").toLowerCase().trim();
  if (raw.startsWith("it")) return "it";
  return "en";
}

export default async function EmergencyPublicPage({ params }: PageProps) {
  try {
    const { token } = await params;
    const h = await headers();

    const lang = detectLanguage(h.get("accept-language"));
    const t = DICT[lang];

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
              {data.settings.showPhoto && data.animal.photoUrl ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 sm:w-56">
                  <div className="relative h-56 w-full sm:w-56">
                    <Image
                      src={data.animal.photoUrl}
                      alt={data.animal.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {t.badge}
                </div>

                {data.settings.showName ? (
                  <h1 className="mt-3 text-2xl font-semibold">{data.animal.name}</h1>
                ) : null}

                {(data.settings.showSpecies || data.settings.showBreed) ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {data.settings.showSpecies ? data.animal.species : ""}
                    {data.settings.showSpecies && data.settings.showBreed && data.animal.breed
                      ? " â€¢ "
                      : ""}
                    {data.settings.showBreed ? data.animal.breed || "" : ""}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {data.settings.showColor ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.color}</div>
                      <div className="mt-1 font-semibold">{data.animal.color || "â€”"}</div>
                    </div>
                  ) : null}

                  {data.settings.showSize ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.size}</div>
                      <div className="mt-1 font-semibold">{data.animal.size || "â€”"}</div>
                    </div>
                  ) : null}

                  {data.settings.showBloodType ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.blood}</div>
                      <div className="mt-1 font-semibold">
                        {data.clinical.bloodType || t.notAvailable}
                      </div>
                    </div>
                  ) : null}

                  {data.settings.showSterilizationStatus ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.sterilized}</div>
                      <div className="mt-1 font-semibold">
                        {data.clinical.sterilizationStatus || "â€”"}
                      </div>
                    </div>
                  ) : null}

                  {data.settings.showOwnerName ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.ownerName}</div>
                      <div className="mt-1 font-semibold">
                        {data.owner.fullName || "â€”"}
                      </div>
                    </div>
                  ) : null}

                  {data.settings.showOwnerPhone ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs text-zinc-500">{t.ownerPhone}</div>
                      <div className="mt-1 font-semibold">
                        {data.owner.phone ? (
                          <a href={`tel:${data.owner.phone}`} className="underline underline-offset-2">
                            {data.owner.phone}
                          </a>
                        ) : (
                          "â€”"
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {data.settings.showAllergies ? (
            <section className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-red-700">
                âš ï¸ {t.allergies}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-800">
                {allergies.map((item, index) => (
                  <li key={index} className="rounded-xl bg-red-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.settings.showTherapies ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">ðŸ’Š {t.therapies}</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-800">
                {therapies.map((item, index) => (
                  <li key={index} className="rounded-xl bg-zinc-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.settings.showChronicConditions ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">ðŸ©º {t.chronic}</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-800">
                {chronic.map((item, index) => (
                  <li key={index} className="rounded-xl bg-zinc-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.settings.emergencyNotes ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">{t.notes}</h2>
              <p className="mt-3 text-sm text-zinc-800">{data.settings.emergencyNotes}</p>
            </section>
          ) : null}

          <p className="px-1 text-xs text-zinc-500">{t.subtitle}</p>
        </div>
      </main>
    );
  } catch (error) {
    console.error("EmergencyPublicPage crashed", error);
    notFound();
  }
}