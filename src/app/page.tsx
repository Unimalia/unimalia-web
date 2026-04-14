import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
  description:
    "UNIMALIA aiuta proprietari e professionisti a gestire identità animale, accessi clinici controllati, consulti, smarrimenti, segnalazioni di animali trovati e lieti fine in modo semplice e affidabile.",
  alternates: {
    canonical: "https://unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    url: "https://unimalia.it/",
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

function MainButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-full bg-[#223a73] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1c3162]"
      : "inline-flex items-center justify-center rounded-full border border-[#d7dfef] bg-white px-6 py-3.5 text-sm font-semibold text-[#223a73] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f7f9fd]";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SectionTitle({
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
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7f9c]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#1f2d4d] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-[#5f6f8e] sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

function BenefitPill({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[#d9e2f1] bg-white p-5 shadow-[0_12px_34px_rgba(32,55,100,0.08)]">
      <p className="text-base font-semibold text-[#223a73]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#60708f]">{text}</p>
    </div>
  );
}

function HighlightCard({
  title,
  text,
  href,
  cta,
  tone = "blue",
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  tone?: "blue" | "orange" | "teal" | "cream";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-[#fff7ee]"
      : tone === "teal"
        ? "bg-[#eefaf7]"
        : tone === "cream"
          ? "bg-[#fffdf7]"
          : "bg-[#f5f8fe]";

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[#d9e2f1] ${toneClass} p-6 shadow-[0_18px_40px_rgba(32,55,100,0.08)]`}
    >
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/60 blur-2xl" />
      <div className="relative">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#d9e2f1]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#f5a93f] via-[#41c8b6] to-[#4b6fbe]" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-[#1f2d4d]">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#60708f] sm:text-base">{text}</p>
        <div className="mt-8">
          <Link
            href={href}
            className="inline-flex items-center text-sm font-semibold text-[#223a73] transition hover:text-[#f08e2d]"
          >
            {cta} →
          </Link>
        </div>
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
  accent,
}: {
  title: string;
  text: string;
  bullets: string[];
  href: string;
  cta: string;
  accent: "blue" | "orange";
}) {
  const accentBg = accent === "orange" ? "bg-[#fff5ea]" : "bg-[#f5f8fe]";
  const dotBg = accent === "orange" ? "bg-[#f29a35]" : "bg-[#223a73]";

  return (
    <div
      className={`rounded-[2rem] border border-[#d9e2f1] ${accentBg} p-7 shadow-[0_18px_40px_rgba(32,55,100,0.08)]`}
    >
      <h3 className="text-2xl font-semibold tracking-tight text-[#1f2d4d]">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-[#60708f] sm:text-base">{text}</p>

      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#46577a]">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dotBg}`} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-[#223a73] transition hover:text-[#f08e2d]"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function FlowCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#d9e2f1] bg-white p-6 shadow-[0_16px_36px_rgba(32,55,100,0.08)]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223a73] text-sm font-semibold text-white">
        {number}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#1f2d4d]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#60708f]">{text}</p>
    </div>
  );
}

function MockPhoneCard() {
  return (
    <div className="relative mx-auto w-full max-w-[470px]">
      <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-[#ffd27a]/60 blur-2xl" />
      <div className="absolute -right-4 bottom-10 h-32 w-32 rounded-full bg-[#9fe6dc]/60 blur-2xl" />

      <div className="relative rounded-[2.25rem] border border-[#d7dfef] bg-white p-5 shadow-[0_30px_80px_rgba(32,55,100,0.18)]">
        <div className="rounded-[1.75rem] bg-gradient-to-br from-[#edf4ff] via-[#fff9f0] to-[#eefaf7] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#70809d]">
                UNIMALIA
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1f2d4d]">
                Proteggi, ritrova, gestisci.
              </h3>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#d9e2f1]">
              <Image
                src="/logo-main.png"
                alt="Logo UNIMALIA"
                width={90}
                height={80}
                className="h-11 w-auto"
                priority
              />
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-[#d9e2f1]">
            <div className="grid gap-4 sm:grid-cols-[1fr_155px] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-[#1f2d4d]">Identità animale digitale</p>
                <p className="mt-2 text-sm leading-relaxed text-[#60708f]">
                  Un’unica base ordinata per QR code, dati principali, accessi controllati e
                  strumenti pronti quando serve davvero.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-medium text-[#223a73]">
                    QR code
                  </span>
                  <span className="rounded-full bg-[#eefbf8] px-3 py-1 text-xs font-medium text-[#1f8c7d]">
                    Accessi clinici
                  </span>
                  <span className="rounded-full bg-[#fff5ea] px-3 py-1 text-xs font-medium text-[#cc7b1d]">
                    Smarrimenti
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative h-[220px] w-[145px] rounded-[2rem] border-[8px] border-[#1f2d4d] bg-[#f8fbff] shadow-[0_12px_35px_rgba(32,55,100,0.12)]">
                  <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-[#1f2d4d]" />
                  <div className="p-3">
                    <div className="rounded-2xl bg-gradient-to-br from-[#223a73] to-[#3f67bd] p-3 text-white">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">
                        Scheda attiva
                      </p>
                      <p className="mt-2 text-sm font-semibold">Luna</p>
                      <p className="text-xs text-white/80">Golden Retriever</p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#d9e2f1]">
                      <div className="mb-2 h-2 rounded-full bg-[#eef3fb]" />
                      <div className="mb-2 h-2 w-5/6 rounded-full bg-[#eef3fb]" />
                      <div className="mb-2 h-2 w-4/6 rounded-full bg-[#eef3fb]" />
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fff6eb] px-2 py-2">
                        <span className="text-[10px] font-semibold text-[#cc7b1d]">QR</span>
                        <span className="text-[10px] text-[#60708f]">attivo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9e2f1]">
              <p className="text-sm font-semibold text-[#223a73]">Smarrimenti</p>
              <p className="mt-1 text-xs leading-relaxed text-[#60708f]">
                Segnalazioni più chiare e più facili da seguire.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9e2f1]">
              <p className="text-sm font-semibold text-[#223a73]">Trovati</p>
              <p className="mt-1 text-xs leading-relaxed text-[#60708f]">
                Avvistamenti e ritrovamenti in un flusso più ordinato.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9e2f1]">
              <p className="text-sm font-semibold text-[#223a73]">Cartella</p>
              <p className="mt-1 text-xs leading-relaxed text-[#60708f]">
                Continuità migliore con i professionisti autorizzati.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-[2.75rem] border border-[#d9e2f1] bg-gradient-to-br from-[#f4f8ff] via-[#fffdf8] to-[#f6fcfa] px-6 py-10 shadow-[0_28px_90px_rgba(32,55,100,0.12)] sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,154,53,0.16),transparent_22%),radial-gradient(circle_at_top_right,rgba(66,199,182,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(75,111,190,0.12),transparent_28%)]" />

        <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#d9e2f1] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7f9c] shadow-sm">
              Identità digitale · Smarrimenti · Cartella clinica
            </p>

            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#1f2d4d] sm:text-5xl lg:text-6xl">
              La piattaforma digitale per proteggere l’animale in ogni momento che conta.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#60708f] sm:text-xl">
              UNIMALIA unisce identità animale, strumenti territoriali, accessi clinici
              controllati e collaborazione con i professionisti in un ecosistema più chiaro,
              affidabile e immediato.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <MainButton href="/identita/nuovo">Crea identità animale</MainButton>
              <MainButton href="/smarrimenti/nuovo" variant="secondary">
                Segnala smarrimento
              </MainButton>
              <MainButton href="/trovati/nuovo" variant="secondary">
                Segnala trovato o avvistato
              </MainButton>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <BenefitPill
                title="Più ordine"
                text="Dati essenziali, QR code e strumenti in una base unica."
              />
              <BenefitPill
                title="Più rapidità"
                text="Azioni principali più visibili, pronte quando servono."
              />
              <BenefitPill
                title="Più continuità"
                text="Flussi più chiari tra proprietari, veterinari e servizi."
              />
            </div>
          </div>

          <div>
            <MockPhoneCard />
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[#d9e2f1] bg-[#fff6eb] p-6 shadow-[0_16px_36px_rgba(32,55,100,0.08)]">
            <p className="text-lg font-semibold text-[#1f2d4d]">Un’unica base più chiara</p>
            <p className="mt-2 text-sm leading-relaxed text-[#60708f]">
              Identità animale, dati essenziali e strumenti utili nello stesso ecosistema.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#d9e2f1] bg-[#eefbf8] p-6 shadow-[0_16px_36px_rgba(32,55,100,0.08)]">
            <p className="text-lg font-semibold text-[#1f2d4d]">Supporto nei momenti delicati</p>
            <p className="mt-2 text-sm leading-relaxed text-[#60708f]">
              Smarrimenti, trovati, avvistamenti e lieti fine in flussi più leggibili.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#d9e2f1] bg-[#f5f8fe] p-6 shadow-[0_16px_36px_rgba(32,55,100,0.08)]">
            <p className="text-lg font-semibold text-[#1f2d4d]">Continuità con i professionisti</p>
            <p className="mt-2 text-sm leading-relaxed text-[#60708f]">
              Accessi controllati, consulti e collaborazione in modo più ordinato.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <SectionTitle
          eyebrow="Strumenti principali"
          title="Tutto quello che serve, organizzato in aree più semplici da capire"
          description="Una homepage più chiara deve far capire subito cosa puoi fare e dove devi andare."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <HighlightCard
            title="Identità digitale"
            text="Una scheda animale moderna con dati essenziali, QR code e base informativa pronta da consultare e usare nel tempo."
            href="/identita/nuovo"
            cta="Crea identità animale"
            tone="blue"
          />

          <HighlightCard
            title="Cartella clinica"
            text="Una continuità migliore con i veterinari grazie ad accessi controllati, visibilità più chiara e collaborazione ordinata."
            href="/professionisti/dashboard"
            cta="Apri area professionisti"
            tone="teal"
          />

          <HighlightCard
            title="Smarrimenti"
            text="Segnala subito un animale smarrito in un flusso più chiaro, pensato per dare struttura e velocità al momento della ricerca."
            href="/smarrimenti/nuovo"
            cta="Segnala smarrimento"
            tone="orange"
          />

          <HighlightCard
            title="Animali trovati e avvistati"
            text="Raccogli segnalazioni utili sul territorio in modo più leggibile, con un sistema progettato per favorire il ricongiungimento."
            href="/trovati/nuovo"
            cta="Segnala trovato o avvistato"
            tone="cream"
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionTitle
              eyebrow="Perché nasce"
              title="Quando le informazioni sono sparse, anche le azioni semplici diventano più difficili."
              description="UNIMALIA nasce per ridurre dispersione, aumentare chiarezza e offrire una base più solida prima dell’emergenza, durante l’emergenza e dopo."
            />

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-[#d9e2f1] bg-white px-5 py-4 text-sm font-semibold text-[#223a73] shadow-sm">
                ✔ Dati essenziali più ordinati
              </div>
              <div className="rounded-2xl border border-[#d9e2f1] bg-white px-5 py-4 text-sm font-semibold text-[#223a73] shadow-sm">
                ✔ Strumenti rapidi quando serve agire
              </div>
              <div className="rounded-2xl border border-[#d9e2f1] bg-white px-5 py-4 text-sm font-semibold text-[#223a73] shadow-sm">
                ✔ Più chiarezza tra proprietari e professionisti
              </div>
              <div className="rounded-2xl border border-[#d9e2f1] bg-white px-5 py-4 text-sm font-semibold text-[#223a73] shadow-sm">
                ✔ Meno dispersione, più continuità
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-[#d9e2f1] bg-gradient-to-br from-[#223a73] to-[#3f67bd] p-7 text-white shadow-[0_26px_70px_rgba(32,55,100,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
              Ecosistema UNIMALIA
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight">
              Tutto più coerente, meno disperso.
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              Identità animale, territorio, emergenza, accessi clinici e collaborazione con i
              professionisti non devono vivere in strumenti scollegati. Devono stare nello stesso
              sistema.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm font-semibold">Identità</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  Scheda animale, QR e dati principali.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm font-semibold">Territorio</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  Smarrimenti, trovati, avvistamenti e lieti fine.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm font-semibold">Clinica</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  Accessi autorizzati e continuità con i veterinari.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm">
              <Link
                href="/professionisti/dashboard"
                className="font-semibold text-white transition hover:text-[#ffd27a]"
              >
                Area professionisti →
              </Link>
              <Link href="/prezzi" className="text-white/80 transition hover:text-white">
                Prezzi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionTitle
          eyebrow="Per chi è"
          title="Due grandi percorsi, ruoli più chiari"
          description="La piattaforma funziona meglio quando ogni persona capisce subito il proprio spazio e le proprie responsabilità."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <AudienceBlock
            title="Veterinari"
            text="Uno spazio più strutturato per lavorare con accessi autorizzati, consulti, cartella clinica e continuità operativa."
            bullets={[
              "Richieste di accesso più chiare e tracciabili.",
              "Lavoro ordinato sulla cartella clinica e sugli eventi.",
              "Collaborazione migliore tra clinica, consulti e follow-up.",
            ]}
            href="/professionisti/dashboard"
            cta="Apri area veterinari"
            accent="blue"
          />

          <AudienceBlock
            title="Professionisti Pet"
            text="Uno spazio dedicato per servizi non clinici, con ruoli distinti e una collaborazione più pulita con l’ecosistema UNIMALIA."
            bullets={[
              "Percorsi separati dall’area clinica veterinaria.",
              "Base pronta per toelettatori, pensioni, pet sitter e addestratori.",
              "Più ordine e più continuità tra i diversi servizi intorno all’animale.",
            ]}
            href="/servizi"
            cta="Scopri i servizi"
            accent="orange"
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionTitle
          eyebrow="Come funziona"
          title="Prima costruisci una base chiara, poi reagisci meglio"
          description="UNIMALIA deve essere utile prima dell’emergenza, durante l’emergenza e anche dopo."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          <FlowCard
            number="1"
            title="Crea la scheda"
            text="Inserisci i dati principali dell’animale e genera la sua identità digitale."
          />
          <FlowCard
            number="2"
            title="Attiva strumenti"
            text="Usa QR, dati essenziali e accessi controllati per preparare una base solida."
          />
          <FlowCard
            number="3"
            title="Gestisci segnalazioni"
            text="In caso di smarrimento, ritrovamento o avvistamento hai già una struttura pronta."
          />
          <FlowCard
            number="4"
            title="Mantieni continuità"
            text="Quando tutto si risolve, le informazioni restano più ordinate e utili nel tempo."
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="rounded-[2.75rem] border border-[#d9e2f1] bg-gradient-to-br from-[#fff9f0] via-white to-[#f5f8fe] px-6 py-8 shadow-[0_28px_90px_rgba(32,55,100,0.12)] sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7f9c]">
                Chiusura
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#1f2d4d] sm:text-4xl lg:text-5xl">
                UNIMALIA rende più semplice proteggere l’animale nel momento in cui conta davvero.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#60708f] sm:text-lg">
                Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali
                trovati, avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <MainButton href="/identita/nuovo">Crea identità animale</MainButton>
              <MainButton href="/smarrimenti/nuovo" variant="secondary">
                Segnala smarrimento
              </MainButton>
              <MainButton href="/trovati/nuovo" variant="secondary">
                Segnala trovato o avvistato
              </MainButton>
              <Link
                href="/prezzi"
                className="pt-2 text-sm text-[#60708f] transition hover:text-[#223a73]"
              >
                Prezzi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}