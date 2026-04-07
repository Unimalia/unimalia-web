import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
  description:
    "UNIMALIA aiuta proprietari e professionisti a gestire identità animale, accessi clinici controllati, consulti, smarrimenti, segnalazioni di animali trovati e lieti fine in modo semplice e affidabile.",
  alternates: {
    canonical: "https://www.unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    url: "https://www.unimalia.it/",
    siteName: "UNIMALIA",
    images: ["/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    images: ["/logo-512.png"],
  },
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/5 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700 shadow-sm">
      {children}
    </span>
  );
}

function PrimaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

function ActionPanel({
  number,
  title,
  text,
  href,
  cta,
}: {
  number: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Azione {number}
        </p>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
          {number}
        </div>
      </div>

      <h3 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>
      <div className="mt-8 text-sm font-semibold text-zinc-900 transition group-hover:text-teal-700">
        {cta} →
      </div>
    </Link>
  );
}

function EditorialCard({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>
      <div className="mt-7">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function AudienceBlock({
  title,
  text,
  bullets,
  href,
  cta,
}: {
  title: string;
  text: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>

      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-[2.25rem] bg-white px-6 py-10 shadow-[0_20px_70px_rgba(0,0,0,0.05)] ring-1 ring-black/5 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_28%),linear-gradient(to_bottom,rgba(255,251,235,0.7),rgba(255,255,255,1))]"
        />

        <div className="relative grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap gap-2">
              <Badge>Identità animale</Badge>
              <Badge>Smarrimenti</Badge>
              <Badge>Trovati / Avvistati</Badge>
              <Badge>Dati clinici controllati</Badge>
            </div>

            <h1 className="mt-8 max-w-5xl text-4xl font-semibold tracking-[-0.06em] text-zinc-900 sm:text-6xl lg:text-7xl">
              Un modo più chiaro, più rapido e più moderno per proteggere un animale.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
              UNIMALIA unisce identità digitale, segnalazioni, accessi controllati e collaborazione
              con professionisti in un unico ecosistema semplice da usare e utile quando serve davvero.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
              <SecondaryCTA href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryCTA>
              <SecondaryCTA href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryCTA>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[2rem] bg-[#f6f1e8] p-6 ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Ecosistema UNIMALIA
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                    Chiaro quando tutto intorno è disperso.
                  </h2>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <Image
                    src="/logo-main.png"
                    alt="Logo UNIMALIA"
                    width={92}
                    height={84}
                    className="h-11 w-auto"
                    priority
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Identità digitale</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Dati essenziali, QR code e strumenti pronti all’uso.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Emergenza e territorio</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Smarrimenti, trovati e avvistamenti raccolti in modo più ordinato.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Collaborazione clinica</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Accessi controllati e continuità migliore tra owner e veterinari.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm">
                <Link
                  href="/professionisti/dashboard"
                  className="font-semibold text-zinc-900 hover:text-teal-700"
                >
                  Area professionisti →
                </Link>
                <Link href="/prezzi" className="text-zinc-600 hover:text-zinc-900">
                  Prezzi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="grid gap-5 xl:grid-cols-3">
          <ActionPanel
            number="1"
            title="Crea l’identità animale"
            text="Parti da una base chiara: dati essenziali, QR code e strumenti pronti all’uso."
            href="/identita/nuovo"
            cta="Inizia ora"
          />
          <ActionPanel
            number="2"
            title="Hai perso un animale?"
            text="Pubblica subito una segnalazione ordinata per muoverti in modo più rapido e concreto."
            href="/smarrimenti/nuovo"
            cta="Segnala smarrimento"
          />
          <ActionPanel
            number="3"
            title="Hai trovato o avvistato un animale?"
            text="Invia una segnalazione utile per facilitare il ricongiungimento e raccogliere informazioni."
            href="/trovati/nuovo"
            cta="Segnala ora"
          />
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionIntro
              eyebrow="Perché nasce"
              title="Quando le informazioni sono sparse, anche le cose semplici diventano più difficili."
              description="Email, carta, messaggi, referti e dettagli salvati in posti diversi rallentano tutto. UNIMALIA nasce per creare una base unica più chiara, prima dell’emergenza e durante l’emergenza."
            />
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-[0_16px_50px_rgba(0,0,0,0.05)] ring-1 ring-black/5">
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#f6f1e8] p-4 text-sm text-zinc-700 ring-1 ring-black/5">
                ✔ Dati essenziali più ordinati
              </div>
              <div className="rounded-2xl bg-[#f6f1e8] p-4 text-sm text-zinc-700 ring-1 ring-black/5">
                ✔ Strumenti rapidi quando serve agire
              </div>
              <div className="rounded-2xl bg-[#f6f1e8] p-4 text-sm text-zinc-700 ring-1 ring-black/5">
                ✔ Più chiarezza tra proprietari e professionisti
              </div>
              <div className="rounded-2xl bg-[#f6f1e8] p-4 text-sm text-zinc-700 ring-1 ring-black/5">
                ✔ Meno dispersione, più continuità
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Cosa puoi fare"
          title="Un’esperienza pensata per orientare subito l’utente"
          description="La home non deve raccontare tutto: deve far capire in pochi secondi quali sono le azioni principali e perché servono."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
          <EditorialCard
            title="Crea l’identità dell’animale"
            text="Raccogli i dati essenziali in una scheda digitale chiara, più semplice da consultare e riutilizzare."
            href="/identita/nuovo"
            cta="Crea identità"
          />
          <EditorialCard
            title="Pubblica uno smarrimento"
            text="Centralizza subito le informazioni importanti e rendi la ricerca più ordinata."
            href="/smarrimenti/nuovo"
            cta="Pubblica smarrimento"
          />
          <EditorialCard
            title="Segnala trovato o avvistato"
            text="Aiuta a raccogliere segnalazioni utili sul territorio in modo più verificabile e leggibile."
            href="/trovati/nuovo"
            cta="Pubblica segnalazione"
          />
          <EditorialCard
            title="Collabora con professionisti"
            text="Concedi accessi controllati e prepara una continuità migliore con veterinari e operatori del settore."
            href="/professionisti/dashboard"
            cta="Vai ai professionisti"
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Per chi è"
          title="Percorsi distinti, ruoli più chiari, linguaggio più semplice"
          description="UNIMALIA funziona meglio quando ogni utente capisce subito il proprio spazio, il proprio ruolo e l’azione giusta da fare."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <AudienceBlock
            title="Per i proprietari"
            text="Uno spazio più ordinato per gestire identità, accessi e momenti delicati senza perdere tempo."
            bullets={[
              "Crei l’identità digitale dell’animale e tieni i dati essenziali in un unico posto.",
              "Decidi tu chi può accedere alle informazioni cliniche e per quanto tempo.",
              "Hai strumenti rapidi per smarrimenti, segnalazioni e rientri con lieto fine.",
            ]}
            href="/identita"
            cta="Apri area identità"
          />

          <AudienceBlock
            title="Per i veterinari"
            text="Un flusso più pulito per accedere ai dati autorizzati, lavorare sulla cartella clinica e gestire consulti."
            bullets={[
              "Richiedi accesso agli animali solo quando autorizzato dal proprietario.",
              "Operi sulla cartella clinica con tracciabilità e ruoli più chiari.",
              "Invii consulti e condividi eventi clinici in modo controllato.",
            ]}
            href="/professionisti/dashboard"
            cta="Apri area veterinari"
          />

          <AudienceBlock
            title="Per altri professionisti"
            text="Uno spazio pensato per crescere oltre l’area clinica, mantenendo funzioni e responsabilità ben distinte."
            bullets={[
              "Toelettatori, pet sitter, pensioni e addestratori avranno strumenti dedicati al proprio lavoro.",
              "Le attività non cliniche resteranno separate dalla cartella veterinaria.",
              "L’obiettivo è favorire collaborazione, ordine e continuità tra servizi diversi.",
            ]}
            href="/servizi"
            cta="Scopri i servizi"
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Come funziona"
          title="Prima prepari una base chiara, poi reagisci meglio"
          description="UNIMALIA deve essere utile prima dell’emergenza, durante l’emergenza e anche dopo."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              1
            </div>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Crea la scheda</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Inserisci i dati principali dell’animale e genera la sua identità digitale.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              2
            </div>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Attiva strumenti e accessi</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Usa QR e codici, poi concedi ai professionisti solo gli accessi necessari.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              3
            </div>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Gestisci segnalazioni</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              In caso di smarrimento, ritrovamento o avvistamento hai già una base più pronta e ordinata.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              4
            </div>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Chiudi con lieto fine</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Quando il caso si risolve, le informazioni restano più chiare e utili anche dopo.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="rounded-[2.25rem] bg-white px-6 py-8 shadow-[0_20px_70px_rgba(0,0,0,0.05)] ring-1 ring-black/5 sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Chiusura
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-4xl lg:text-5xl">
                UNIMALIA serve a rendere più semplice proteggere l’animale, nel momento in cui conta davvero.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali trovati,
                avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
              <SecondaryCTA href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryCTA>
              <SecondaryCTA href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryCTA>
              <Link href="/prezzi" className="pt-2 text-sm text-zinc-600 hover:text-zinc-900">
                Prezzi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}