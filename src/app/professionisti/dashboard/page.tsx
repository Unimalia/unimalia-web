import Link from "next/link";
import ClinicAgendaDashboardWidget from "@/_components/professionisti/ClinicAgendaDashboardWidget";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

function CardLink({
  href,
  title,
  desc,
  right,
}: {
  href: string;
  title: string;
  desc: string;
  right?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_8px_24px_rgba(42,56,86,0.04)] transition hover:border-[#d3dce7] hover:bg-[#fbfdff] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold tracking-[-0.02em] text-[#30486f]">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-[#5f708a]">{desc}</div>
        </div>

        {right ? (
          <div className="shrink-0 rounded-full border border-[#d7dfe9] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#4f6078]">
            {right}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function categoryLabel(category: string | null, isVet: boolean) {
  if (isVet) return "Veterinario";

  switch ((category || "").trim()) {
    case "toelettatura":
      return "Toelettatura";
    case "pensione":
      return "Pensione";
    case "pet_sitter":
      return "Pet sitter & Dog walking";
    case "addestramento":
      return "Addestramento";
    case "pet_detective":
      return "Pet Detective";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "altro":
      return "Altro";
    default:
      return "Professionista";
  }
}

export const dynamic = "force-dynamic";

export default async function ProDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const resolved = await searchParams;
  const showPendingBanner = resolved?.pending === "1";

  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVet = false;
  let displayName: string | null = null;
  let category: string | null = null;

  if (user) {
    const { data: professional } = await admin
      .from("professionals")
      .select("display_name, category, is_vet")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    isVet = professional?.is_vet === true;
    displayName = professional?.display_name ?? null;
    category = professional?.category ?? null;
  }

  const roleLabel = categoryLabel(category, isVet);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                Portale Professionisti
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-3 text-sm leading-7 text-[#5f708a] sm:text-base">
                {isVet
                  ? "Hub operativo del Portale Professionisti veterinari."
                  : "Hub operativo del Portale Professionisti non clinici."}
              </p>

              {displayName ? (
                <div className="mt-4 inline-flex items-center rounded-full border border-[#d7dfe9] bg-[#f8fbff] px-4 py-2 text-sm font-medium text-[#4f6078]">
                  {displayName} • {roleLabel}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:min-w-[260px]">
              <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                  Stato profilo
                </p>
                <p className="mt-2 text-sm font-semibold text-[#30486f]">
                  {isVet ? "Profilo veterinario attivo" : "Profilo professionale attivo"}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                  Ruolo
                </p>
                <p className="mt-2 text-sm font-semibold text-[#30486f]">{roleLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {showPendingBanner ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-5 shadow-[0_8px_24px_rgba(42,56,86,0.03)]">
            <p className="text-sm font-semibold text-amber-900">Profilo in verifica</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              La scheda professionista è stata salvata correttamente. Il profilo sarà verificato
              entro 24/48 ore prima dell’abilitazione completa delle funzioni riservate.
            </p>
          </div>
        ) : null}

        {isVet ? (
          <div className="mt-5">
            <ClinicAgendaDashboardWidget />
          </div>
        ) : null}

        {!isVet ? (
          <div className="mt-5 rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_8px_24px_rgba(42,56,86,0.04)]">
            <p className="text-sm font-semibold text-[#30486f]">Area professionista non clinica</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
              Questa dashboard è dedicata a professionisti come addestratori, toelettatori, pet
              sitter, pensioni, pet detective e altri operatori non veterinari.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
              La parte clinica resta separata e riservata ai veterinari. Per i professionisti
              generici, il lavoro operativo passa dalla sezione <strong>Storia animale</strong>.
            </p>
          </div>
        ) : null}

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#30486f]">
              Accessi rapidi
            </h2>
            <p className="mt-1 text-sm text-[#5f708a]">
              Strumenti principali del portale, organizzati per uso operativo.
            </p>
          </div>

          <div className="grid gap-3">
            <CardLink
              href="/professionisti/scansiona"
              title="Scansiona"
              desc="Microchip / QR per aprire rapidamente un animale."
            />

            <CardLink
              href="/professionisti/animali"
              title="Animali in gestione"
              desc="Vedi solo animali con accesso attivo per la tua struttura."
            />

            {isVet ? (
              <>
                <CardLink
                  href="/professionisti/richieste"
                  title="Consulti veterinari"
                  desc="Invia, ricevi e gestisci consulenze cliniche con altri veterinari, con condivisione della cartella animale."
                />

                <CardLink
                  href="/professionisti/agenda"
                  title="Agenda clinica"
                  desc="Agenda integrata con appuntamenti, turni veterinari, stanze e accesso rapido alla gestione completa."
                />

                <CardLink
                  href="/professionisti/impostazioni/agenda"
                  title="Impostazioni agenda"
                  desc="Configura veterinari, turni settimanali, override per data, stanze e prestazioni."
                />
              </>
            ) : (
              <>
                <CardLink
                  href="/professionisti/animali"
                  title="Storia animale"
                  desc="Timeline non clinica dedicata alle attività del professionista: sessioni, trattamenti, note operative e promemoria futuri."
                />

                <CardLink
                  href="/professionisti/richieste-accesso"
                  title="Richieste accesso"
                  desc="Invia richieste per essere autorizzato sugli animali e iniziare a lavorare nella storia pratica."
                />

                <CardLink
                  href="/professionisti/animali"
                  title="Attività e progressi"
                  desc="Sezione futura per registrare lavori svolti, aggiornamenti, esercizi consigliati e prossime attività."
                  right="In arrivo"
                />
              </>
            )}

            <CardLink
              href="/professionisti/impostazioni"
              title="Impostazioni"
              desc="Profilo, organizzazione, preferenze."
            />
          </div>
        </section>
      </div>
    </main>
  );
}