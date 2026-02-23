// app/page.tsx
import Link from "next/link";

function Pill({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "amber" | "teal";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "teal"
        ? "border-teal-200 bg-teal-50 text-teal-900"
        : "border-zinc-200 bg-white text-zinc-700";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  hrefPrimary,
  labelPrimary,
  hrefSecondary,
  labelSecondary,
  tone,
}: {
  title: string;
  desc: string;
  icon: string;
  hrefPrimary: string;
  labelPrimary: string;
  hrefSecondary?: string;
  labelSecondary?: string;
  tone?: "amber" | "teal" | "zinc";
}) {
  const border =
    tone === "amber"
      ? "border-amber-200"
      : tone === "teal"
        ? "border-teal-200"
        : "border-zinc-200";

  const bg =
    tone === "amber"
      ? "bg-amber-50/40"
      : tone === "teal"
        ? "bg-teal-50/40"
        : "bg-white";

  const pillTone = tone ?? "zinc";

  return (
    <div className={`flex h-full flex-col rounded-2xl border ${border} ${bg} p-6 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Pill tone={pillTone}>
            <span aria-hidden="true">{tone === "amber" ? "❤️" : tone === "teal" ? "🛡️" : "🔷"}</span>
            {tone === "amber" ? "Essenziale" : tone === "teal" ? "Fiducia" : "Sezione"}
          </Pill>
          <h3 className="mt-3 text-xl font-semibold text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <span className="text-lg" aria-hidden="true">
            {icon}
          </span>
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={hrefPrimary}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          {labelPrimary}
        </Link>

        {hrefSecondary && labelSecondary ? (
          <Link
            href={hrefSecondary}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            {labelSecondary}
          </Link>
        ) : null}
      </div>

      <div className="mt-auto pt-6">
        <div className="h-px w-full bg-zinc-200/70" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      {/* HERO */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            {/* background accents (più soft, meno invadenti) */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-teal-200/15 blur-3xl" />

            <div className="relative p-7 sm:p-12">
              {/* top pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="amber">
                  <span aria-hidden="true">❤️</span> Serio ma umano
                </Pill>
                <Pill>
                  <span aria-hidden="true">🪪</span> Identità digitale
                </Pill>
                <Pill>
                  <span aria-hidden="true">🔎</span> Smarrimenti
                </Pill>
                <Pill>
                  <span aria-hidden="true">👨‍⚕️</span> Professionisti
                </Pill>
              </div>

              <div className="mt-10 grid gap-10 md:grid-cols-12 md:items-start">
                <div className="md:col-span-7">
                  <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
                    UNIMALIA
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600">
                    Un ecosistema digitale per proteggere la vita dell’animale.
                    <br />
                    Poche cose, fatte bene: identità, codici, smarrimenti e strumenti per i professionisti.
                  </p>

                  {/* value block */}
                  <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-900">
                      In emergenza conta la semplicità.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      Apri la scheda dell’animale e hai QR/Barcode pronti per condivisione o verifica.
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <PrimaryButton href="/identita/nuovo">Crea identità animale</PrimaryButton>
                    <SecondaryButton href="/smarrimenti/nuovo">Pubblica smarrimento</SecondaryButton>
                    <Link href="/login" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
                      Accedi →
                    </Link>
                  </div>

                  <p className="mt-8 text-xs leading-relaxed text-zinc-500">
                    “Si diventa enormi facendo benissimo una cosa minuscola.”
                  </p>
                </div>

                {/* right column: compact quick actions */}
                <div className="md:col-span-5">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                    <p className="mt-1 text-sm text-zinc-600">Vai dritto al punto.</p>

                    <div className="mt-5 grid gap-3">
                      <Link
                        href="/identita"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Le mie identità
                      </Link>
                      <Link
                        href="/smarrimenti"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Smarrimenti
                      </Link>
                      <Link
                        href="/professionisti"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Portale professionisti
                      </Link>
                    </div>

                    <div className="mt-7 rounded-2xl border border-teal-200 bg-teal-50 p-5">
                      <p className="text-sm font-semibold text-teal-900">Fiducia, prima di tutto.</p>
                      <p className="mt-2 text-sm leading-relaxed text-teal-800">
                        Dati essenziali, accesso rapido, e una struttura pensata per aiutare davvero.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* subtle divider */}
              <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
          <h2 className="sr-only">Sezioni principali</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <FeatureCard
              title="Smarrimenti"
              desc="Pubblica o consulta annunci con informazioni essenziali e un flusso rapido."
              hrefPrimary="/smarrimenti/nuovo"
              labelPrimary="Pubblica"
              hrefSecondary="/smarrimenti"
              labelSecondary="Consulta"
              icon="📍"
              tone="teal"
            />

            <FeatureCard
              title="Identità animale"
              desc="Scheda completa con microchip e codici (QR + barcode) pronti."
              hrefPrimary="/identita/nuovo"
              labelPrimary="Crea scheda"
              hrefSecondary="/identita"
              labelSecondary="Apri identità"
              icon="🪪"
              tone="amber"
            />

            <FeatureCard
              title="Servizi"
              desc="Trova professionisti e strutture. Sezione in crescita."
              hrefPrimary="/servizi"
              labelPrimary="Cerca servizi"
              icon="🩺"
              tone="zinc"
            />

            <FeatureCard
              title="Adotta"
              desc="Annunci e filtri (in arrivo). Prima pulito, poi potente."
              hrefPrimary="/adotta"
              labelPrimary="Vai ad adotta"
              icon="🏡"
              tone="zinc"
            />
          </div>
        </div>
      </section>
    </main>
  );
}