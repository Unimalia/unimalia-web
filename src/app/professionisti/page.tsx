import Link from "next/link";
import ClinicAgendaDashboardWidget from "@/_components/professionisti/ClinicAgendaDashboardWidget";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isVetinfoConfigured } from "@/lib/vetinfo/config";

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
      className="block rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#30486f]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">{desc}</p>
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
  const vetinfoConfigured = isVetinfoConfigured();

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                Portale professionisti
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[#30486f] sm:text-5xl lg:text-6xl">
                Dashboard professionale operativa
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5f708a] sm:text-lg">
                {isVet
                  ? "Hub operativo del Portale Professionisti veterinari: accessi, animali in gestione, consulti, agenda clinica e impostazioni professionali."
                  : "Hub operativo del Portale Professionisti non clinici: accessi, animali in gestione, storia pratica e strumenti dedicati al proprio ruolo."}
              </p>

              {displayName ? (
                <div className="mt-6 inline-flex items-center rounded-full border border-[#d7dfe9] bg-[#f8fbff] px-4 py-2 text-sm font-medium text-[#4f6078]">
                  {displayName} • {roleLabel}
                </div>
              ) : null}
            </div>

            <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
              <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Stato area
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                  {isVet ? "Profilo clinico attivo" : "Profilo professionale attivo"}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
                  {isVet
                    ? "Area dedicata a veterinari e strutture cliniche con accesso a strumenti riservati, organizzazione operativa e flussi professionali strutturati."
                    : "Area dedicata ai professionisti non clinici, separata dalla cartella veterinaria e pensata per attività pratiche, storico e continuità operativa."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {roleLabel}
                  </span>

                  {isVet ? (
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        vetinfoConfigured
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-800",
                      ].join(" ")}
                    >
                      {vetinfoConfigured ? "REV configurato" : "REV in preparazione"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {showPendingBanner ? (
          <div className="mt-6 rounded-[2rem] border border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] p-6 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Profilo in verifica
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              La scheda professionista è stata salvata correttamente
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
              Il profilo sarà verificato entro 24/48 ore prima dell’abilitazione completa delle
              funzioni riservate.
            </p>
          </div>
        ) : null}

        {isVet ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                    REV / VetInfo
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                    Integrazione prescrizioni elettroniche
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#5f708a]">
                    Area preparata per il nuovo flusso REV personale del veterinario. Il
                    collegamento reale SPID/CAS verrà attivato appena saranno confermati i dati
                    definitivi.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      vetinfoConfigured
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-amber-200 bg-amber-50 text-amber-800",
                    ].join(" ")}
                  >
                    {vetinfoConfigured ? "Configurazione presente" : "Configurazione non attiva"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/professionisti/impostazioni"
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
                >
                  Apri impostazioni REV
                </Link>

                <span className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-[#f8fbff] px-5 py-3 text-sm font-semibold text-[#4f6078]">
                  Nuova prescrizione • in preparazione
                </span>
              </div>
            </div>

            <ClinicAgendaDashboardWidget />
          </div>
        ) : null}

        {!isVet ? (
          <div className="mt-6 rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
              Area non clinica
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
              Dashboard professionista non clinico
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
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
          <div className="grid gap-4">
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

                <CardLink
                  href="/professionisti/impostazioni"
                  title="REV / VetInfo"
                  desc="Stato collegamento personale veterinario, configurazione e attivazione futura prescrizioni elettroniche."
                  right={vetinfoConfigured ? "Pronto" : "In preparazione"}
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