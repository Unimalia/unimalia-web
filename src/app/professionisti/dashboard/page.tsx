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
      className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{desc}</div>
        </div>

        {right ? (
          <div className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
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
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {isVet
          ? "Hub operativo del Portale Professionisti veterinari."
          : "Hub operativo del Portale Professionisti non clinici."}
      </p>

      {displayName ? (
        <p className="mt-1 text-xs text-zinc-500">
          {displayName} • {roleLabel}
        </p>
      ) : null}

      {showPendingBanner ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">Profilo in verifica</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            La scheda professionista è stata salvata correttamente. Il profilo sarà verificato entro
            24/48 ore prima dell’abilitazione completa delle funzioni riservate.
          </p>
        </div>
      ) : null}

      {isVet ? (
        <div className="mt-6">
          <ClinicAgendaDashboardWidget />
        </div>
      ) : null}

      {!isVet ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm font-semibold text-zinc-900">Area professionista non clinica</p>
          <p className="mt-2 text-sm text-zinc-700">
            Questa dashboard è dedicata a professionisti come addestratori, toelettatori, pet sitter,
            pensioni, pet detective e altri operatori non veterinari.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            La parte clinica resta separata e riservata ai veterinari. Per i professionisti generici,
            il lavoro evolverà sulla sezione <strong>Storia animale</strong>.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <CardLink
          href="/professionisti/scansiona"
          title="Scansiona"
          desc="Microchip / QR per aprire rapidamente un animale."
        />

        <CardLink
          href="/professionisti/animali"
          title="Animali in gestione"
          desc="Vedi solo animali con grant attivo per la tua struttura."
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
              right="In arrivo"
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
    </div>
  );
}