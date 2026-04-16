import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE_URL = "https://www.unimalia.it";
const pagePath = "/rete/veterinari";
const pageTitle = "Veterinari e Rete UNIMALIA";
const pageDescription =
  "Scopri cosa offre UNIMALIA ai veterinari: cartella sanitaria digitale, invio referti, consulti veterinari tra colleghi, gestione pazienti attivi, remind e strumenti per la clinica.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: `${SITE_URL}${pagePath}`,
  },
  openGraph: {
    title: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
    url: `${SITE_URL}${pagePath}`,
    siteName: "UNIMALIA",
    locale: "it_IT",
    type: "article",
    images: [`${SITE_URL}/logo-512.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
    images: [`${SITE_URL}/logo-512.png`],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Cosa può fare un veterinario con UNIMALIA?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Può gestire la cartella sanitaria digitale, aggiungere eventi clinici, aggiornare i dati essenziali, inviare referti al proprietario, scambiarsi consulti con altri veterinari della Rete e lavorare sui pazienti attivi con grant valido.",
      },
    },
    {
      "@type": "Question",
      name: "Come funzionano i consulti veterinari?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "I veterinari della Rete UNIMALIA possono scambiarsi consulti tramite una sezione dedicata, con logica simile a una inbox email: invii, risposte, archivio e condivisione rapida dello storico dell’animale.",
      },
    },
    {
      "@type": "Question",
      name: "I proprietari ricevono sempre i referti?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Sì. Quando il veterinario utilizza questo canale, il proprietario riceve il referto via email. Se ha Premium, può anche vedere la timeline completa e organizzata all’interno della piattaforma.",
      },
    },
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}${pagePath}#webpage`,
  url: `${SITE_URL}${pagePath}`,
  name: `${pageTitle} | UNIMALIA`,
  description: pageDescription,
  inLanguage: "it-IT",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[#55657d] sm:text-base">{children}</div>
    </section>
  );
}

function CtaButton({
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
      ? "inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
      : "inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function ReteVeterinariPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <Script
        id="jsonld-rete-veterinari-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-rete-veterinari-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5f708a]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-[#30486f]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/professionisti/login" className="transition hover:text-[#30486f]">
                Portale Professionisti
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#30486f]">Veterinari</li>
          </ol>
        </nav>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <header className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Rete UNIMALIA
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Veterinari e Rete UNIMALIA
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                UNIMALIA offre ai veterinari uno spazio digitale per lavorare in modo più ordinato,
                condividere informazioni utili, seguire i propri pazienti e collaborare con altri
                colleghi della rete. Non solo referti: anche consulti, storico animale, remind e
                strumenti per una gestione più moderna della clinica.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CtaButton href="/professionisti/login?mode=signup">
                  Iscriviti come veterinario
                </CtaButton>
                <CtaButton href="/professionisti/login" variant="secondary">
                  Accedi al portale
                </CtaButton>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Building the Digital Infrastructure of Veterinary Care
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Continuità clinica, consulti e gestione più moderna del lavoro veterinario
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                UNIMALIA è pensata per aiutare il veterinario a lavorare meglio sul piano clinico,
                organizzativo e relazionale, in un ecosistema più ordinato e più tracciabile.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Cartella sanitaria digitale</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Un flusso più chiaro per eventi clinici, informazioni utili e continuità nel
                    tempo.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Consulti tra colleghi</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Uno spazio dedicato per condividere casi, storico e confronto professionale in
                    modo più ordinato.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Strumenti per la clinica</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Pazienti attivi, remind, agenda e sviluppo di un’infrastruttura sempre più
                    utile per il lavoro quotidiano.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <Section title="Cartella sanitaria digitale">
              <p>
                UNIMALIA permette di lavorare su una cartella sanitaria digitale pensata per
                raccogliere in modo più ordinato le informazioni utili dell’animale.
              </p>
              <p>
                In pratica, quando il veterinario aggiunge un evento clinico, compie in un unico
                flusso tre azioni importanti:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>aggiunge l’evento</li>
                <li>aggiorna la cartella sanitaria dell’animale</li>
                <li>invia al proprietario quanto fatto, con eventuale referto via email</li>
              </ul>
            </Section>

            <Section title="La funzione più importante: consulti veterinari tra colleghi">
              <p>
                I veterinari che fanno parte della <strong>Rete UNIMALIA</strong> possono
                scambiarsi consulti tramite una sezione dedicata, progettata con una logica simile
                a una inbox email.
              </p>
              <p>Questo significa poter gestire:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>invii</li>
                <li>risposte</li>
                <li>archivio consulti</li>
                <li>condivisione rapida dello storico dell’animale con un click</li>
              </ul>
              <p>
                In questo modo il confronto tra colleghi diventa più ordinato, più tracciabile e
                più utile nei casi in cui serve continuità clinica.
              </p>
            </Section>

            <Section title="Referti e rapporto con il proprietario">
              <p>
                Se il veterinario utilizza questo canale, il proprietario riceve comunque i referti
                via email.
              </p>
              <p>
                Per i proprietari Premium, oltre alla mail, la documentazione può essere consultata
                anche in una timeline completa e organizzata all’interno della piattaforma.
              </p>
            </Section>

            <Section title="Remind e follow-up">
              <p>
                I veterinari possono impostare remind per controlli, vaccini o altre necessità
                cliniche.
              </p>
              <p>
                Le notifiche verso il proprietario sono disponibili quando il proprietario ha un
                piano Premium attivo.
              </p>
            </Section>

            <Section title="Accesso ai pazienti anche fuori dalla clinica">
              <p>
                Essendo una piattaforma web e non un software installato solo sul computer della
                clinica, UNIMALIA permette di consultare i propri pazienti anche fuori sede, ad
                esempio quando si è reperibili.
              </p>
              <p>
                Questo vale nei limiti del <strong>grant attivo</strong>, quindi solo quando esiste
                un’autorizzazione valida da parte del proprietario.
              </p>
            </Section>

            <Section title="Pazienti attivi e concessioni">
              <p>
                La clinica può avere una visione più chiara dei propri pazienti attivi e distinguere
                tra:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>pazienti con concessione a tempo indeterminato</li>
                <li>pazienti con concessione limitata a un periodo di consulto</li>
              </ul>
              <p>
                Questo aiuta a lavorare con maggiore chiarezza anche sul piano organizzativo.
              </p>
            </Section>

            <Section title="Ricerca per zona e competenze reali">
              <p>
                All’interno del sito è presente anche una sezione di ricerca che permette ai
                veterinari di essere trovati per zona e per competenze reali.
              </p>
              <p>
                Questo può essere utile sia per visite specialistiche sia per essere trovati più
                facilmente dai proprietari anche all’interno della piattaforma.
              </p>
            </Section>

            <Section title="Agenda intelligente in evoluzione">
              <p>
                È in costruzione, ed è già stata implementata in parte, una futura agenda
                intelligente pensata per supportare anche le prenotazioni online.
              </p>
              <p>
                L’obiettivo è integrare meglio il lavoro clinico, l’organizzazione interna e il
                rapporto con il proprietario in un unico ecosistema.
              </p>
            </Section>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Perché entrare nella rete
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Uno spazio professionale pensato per il lavoro veterinario reale
              </h2>

              <ul className="mt-6 list-disc space-y-3 pl-6 text-sm leading-7 text-[#55657d] sm:text-base">
                <li>lavori su una cartella sanitaria digitale più ordinata</li>
                <li>inserisci evento, aggiorni cartella e invii referto in un solo flusso</li>
                <li>puoi scambiarti consulti con altri veterinari della rete</li>
                <li>puoi vedere i pazienti attivi anche fuori dalla clinica, con grant valido</li>
                <li>puoi essere trovato nella piattaforma per zona e competenze</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Richiedi informazioni
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Vuoi capire come può funzionare UNIMALIA nella tua clinica?
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d] sm:text-base">
                Se non utilizzi ancora UNIMALIA e vuoi capire meglio come funziona la piattaforma
                per la tua clinica o per la tua attività veterinaria, puoi contattarci direttamente.
              </p>

              <div className="mt-6 rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] px-5 py-4">
                <p className="text-sm font-semibold text-[#30486f]">Contatto dedicato</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  professionisti@unimalia.it
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <CtaButton href="/professionisti/login?mode=signup">
                  Iscriviti come veterinario
                </CtaButton>
                <CtaButton href="/professionisti/login" variant="secondary">
                  Accedi al portale
                </CtaButton>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-[30px] border border-[#e3e9f0] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.2)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Rete veterinaria
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                L’infrastruttura digitale che mancava al mondo veterinario
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">
                Cartella sanitaria digitale, consulti tra colleghi, continuità clinica e strumenti
                in evoluzione per aiutare il veterinario a lavorare in modo più moderno, più chiaro
                e più efficace.
              </p>

              <div className="mt-8">
                <CtaButton href="/professionisti/login?mode=signup">
                  Entra nella Rete UNIMALIA
                </CtaButton>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}