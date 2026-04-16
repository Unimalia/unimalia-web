import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scopri UNIMALIA | Come funziona la piattaforma",
  description:
    "Scopri come funziona UNIMALIA: identità animale, smarrimenti, continuità clinica, owner, veterinari, professionisti e funzioni avanzate in un unico ecosistema digitale.",
  alternates: {
    canonical: "https://unimalia.it/scopri-unimalia",
  },
  openGraph: {
    title: "Scopri UNIMALIA | Come funziona la piattaforma",
    description:
      "Una guida chiara a identità animale, smarrimenti, area professionisti, continuità clinica e funzioni evolute di UNIMALIA.",
    url: "https://unimalia.it/scopri-unimalia",
    siteName: "UNIMALIA",
    images: ["/home/logo-app.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scopri UNIMALIA | Come funziona la piattaforma",
    description:
      "Una guida chiara a identità animale, smarrimenti, area professionisti, continuità clinica e funzioni evolute di UNIMALIA.",
    images: ["/home/logo-app.png"],
  },
};

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
      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,105,199,0.24)] transition hover:scale-[1.01]"
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
      className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-7 py-3.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-relaxed text-[#5f708a] sm:text-lg">{text}</p>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <h3 className="text-xl font-semibold tracking-tight text-[#30486f]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#5f708a] sm:text-base">{text}</p>
    </div>
  );
}

function BulletCard({
  title,
  bullets,
}: {
  title: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-7 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <h3 className="text-2xl font-semibold tracking-tight text-[#30486f]">{title}</h3>
      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#4f6078]">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2f69c7]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-7 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#30486f] text-sm font-semibold text-white">
        {number}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#30486f]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">{text}</p>
    </div>
  );
}

export default function ScopriUnimaliaPage() {
  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-[1260px] px-4 py-8 md:py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
          <div className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
              Scopri UNIMALIA
            </p>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-[#30486f] sm:text-5xl lg:text-6xl">
              Una piattaforma unica per identità animale, continuità clinica, smarrimenti e rete professionale.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#5f708a]">
              UNIMALIA nasce per mettere ordine dove oggi spesso ci sono frammentazione,
              messaggi sparsi, documenti difficili da recuperare e strumenti separati.
              L’obiettivo è creare una base unica più chiara e utile per proprietari,
              veterinari e professionisti del mondo animale.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryButton href="/identita/nuovo">Crea identità animale</PrimaryButton>
              <SecondaryButton href="/professionisti/login">Entra nel Portale Professionisti</SecondaryButton>
              <SecondaryButton href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryButton>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-18">
          <SectionIntro
            eyebrow="Cos’è"
            title="La base digitale che collega tutto ciò che conta davvero"
            text="UNIMALIA non è solo una scheda animale e non è solo un portale clinico. È un’infrastruttura che mette in relazione identità, dati, accessi, emergenze, segnalazioni territoriali e collaborazione tra professionisti."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              title="Identità animale"
              text="Una base digitale ordinata per raccogliere dati essenziali, strumenti utili, QR e funzioni collegate all’animale."
            />
            <InfoCard
              title="Smarrimenti e ritrovamenti"
              text="Segnalazioni più chiare, rapide e centralizzate per agire meglio nei momenti critici."
            />
            <InfoCard
              title="Continuità clinica"
              text="Una struttura pensata per favorire ordine, tracciabilità e collaborazione tra veterinari e strutture."
            />
            <InfoCard
              title="Rete professionale"
              text="Uno spazio in crescita per servizi, professionisti e futura integrazione di funzioni sempre più avanzate."
            />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <SectionIntro
            eyebrow="Per i proprietari"
            title="Più controllo, più chiarezza, meno dispersione"
            text="Per l’owner, UNIMALIA serve a costruire una base affidabile e utilizzabile nel tempo, non solo in emergenza."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <BulletCard
              title="Cosa può fare un proprietario"
              bullets={[
                "Creare l’identità digitale del proprio animale.",
                "Tenere i dati essenziali in un unico punto più ordinato.",
                "Gestire smarrimenti, ritrovamenti, avvistamenti e lieti fine.",
                "Controllare nel tempo accessi e continuità delle informazioni.",
                "Prepararsi meglio a situazioni urgenti o delicate.",
              ]}
            />

            <BulletCard
              title="Funzioni avanzate e crescita futura"
              bullets={[
                "Cartella clinica sempre più strutturata e utile nel tempo.",
                "Promemoria e strumenti evoluti per chi usa funzioni premium.",
                "QR e medaglietta intelligente come estensione fisica dell’identità animale.",
                "Maggiore ordine tra dati, documenti e cronologia dell’animale.",
                "Possibile evoluzione futura verso servizi sempre più integrati.",
              ]}
            />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <SectionIntro
            eyebrow="Per veterinari e cliniche"
            title="Un’infrastruttura più seria per lavorare meglio"
            text="Per l’area professionale, UNIMALIA punta a ridurre dispersione, migliorare la gestione degli accessi e costruire una continuità più forte tra cliniche, veterinari e dati animali."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <BulletCard
              title="Veterinari"
              bullets={[
                "Accesso a strumenti pensati per la gestione dell’animale e della relazione clinica.",
                "Cartella clinica condivisa e consulti in evoluzione.",
                "Tracciabilità più ordinata di eventi, referti e attività.",
              ]}
            />

            <BulletCard
              title="Cliniche"
              bullets={[
                "Gestione più coerente degli animali e dei flussi professionali.",
                "Più continuità informativa tra struttura, veterinari e proprietari.",
                "Base pronta per agenda, organizzazione e sviluppo futuro.",
              ]}
            />

            <BulletCard
              title="Altri professionisti"
              bullets={[
                "Spazio dedicato a toelettatori, pensioni, pet sitter, educatori e altri servizi.",
                "Ruoli e funzioni separati dalla parte clinica veterinaria.",
                "Crescita futura verso strumenti pratici e collaborazione ordinata.",
              ]}
            />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <SectionIntro
            eyebrow="Come iniziare"
            title="Entrare in UNIMALIA è semplice"
            text="Il percorso dipende dal tuo ruolo, ma la logica è sempre la stessa: prima si crea una base chiara, poi si attivano strumenti, accessi e funzioni collegate."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            <StepCard
              number="1"
              title="Scegli il tuo percorso"
              text="Owner, veterinario o altro professionista: ogni ruolo entra da una porta corretta."
            />
            <StepCard
              number="2"
              title="Crea la tua base"
              text="Identità animale, profilo, strumenti iniziali e struttura minima ordinata."
            />
            <StepCard
              number="3"
              title="Attiva funzioni utili"
              text="Smarrimenti, accessi, collaborazione, storico e strumenti dedicati."
            />
            <StepCard
              number="4"
              title="Cresci nel tempo"
              text="UNIMALIA è pensata per essere utile subito ma diventare sempre più forte nel tempo."
            />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="overflow-hidden rounded-[2.5rem] border border-[#e3e9f0] bg-white shadow-[0_24px_80px_rgba(42,56,86,0.08)]">
            <div className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                Punti di accesso principali
              </p>

              <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl lg:text-5xl">
                Scegli da dove partire
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Link
                  href="/identita/nuovo"
                  className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
                >
                  <p className="text-lg font-semibold text-[#30486f]">Identità animale</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                    Crea la base digitale del tuo animale.
                  </p>
                </Link>

                <Link
                  href="/smarrimenti/nuovo"
                  className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
                >
                  <p className="text-lg font-semibold text-[#30486f]">Smarrimenti</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                    Pubblica una segnalazione chiara e immediata.
                  </p>
                </Link>

                <Link
                  href="/professionisti/login"
                  className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
                >
                  <p className="text-lg font-semibold text-[#30486f]">Area professionisti</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                    Accedi o registrati al portale dedicato.
                  </p>
                </Link>

                <Link
                  href="/servizi"
                  className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
                >
                  <p className="text-lg font-semibold text-[#30486f]">Servizi</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                    Esplora rete e servizi del mondo animale.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}