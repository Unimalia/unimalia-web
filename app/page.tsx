import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">
            HUB PER ANIMALI • SMARRIMENTI • IDENTITÀ DIGITALE • PROFESSIONISTI
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            UNIMALIA è il luogo dove animale e proprietario restano connessi.
          </h1>

          <p className="mt-5 max-w-2xl text-base text-zinc-700 sm:text-lg">
            Nasciamo dagli <span className="font-semibold">smarrimenti</span> (perché lì serve una
            soluzione immediata), e costruiamo un ecosistema che rende più semplice
            gestire la vita dell’animale: identità digitale, informazioni utili, e in futuro
            un ponte diretto con i professionisti.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/smarrimenti"
              className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Vedi smarrimenti attivi
            </Link>

            <Link
              href="/smarrimenti/nuovo"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Pubblica uno smarrimento
            </Link>

            <Link
              href="/identita"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Identità animale
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Smarrimenti sempre gratuiti. L’identità digitale dell’animale è un servizio in evoluzione.
          </p>
        </div>
      </section>

      {/* COSA FACCIAMO */}
      <section className="mx-auto mt-10 max-w-5xl px-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Cosa fa UNIMALIA
        </h2>
        <p className="mt-3 max-w-3xl text-zinc-700">
          Unimalia non è “solo” un sito per ritrovare animali. È un hub: oggi risolve un problema urgente,
          domani diventa lo standard di gestione digitale per l’animale (senza sostituire i documenti ufficiali).
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Smarrimenti e ritrovamenti"
            desc="Pubblica e condividi segnalazioni in modo rapido. Credibilità e chiarezza prima di tutto."
            badge="Attivo ora"
          />
          <FeatureCard
            title="Identità digitale dell’animale"
            desc="Un profilo unico con foto, dati utili, contatti. Pronto quando serve."
            badge="In evoluzione"
          />
          <FeatureCard
            title="Collegamento con professionisti"
            desc="In futuro: veterinari, toelettature, educatori, pensioni, pet-sitter… in un solo posto."
            badge="Prossimamente"
          />
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="mx-auto mt-12 max-w-5xl px-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Come funziona (in 3 passi)
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Step
              n="1"
              title="Crea un profilo"
              desc="Aggiungi il tuo animale: foto e informazioni essenziali."
            />
            <Step
              n="2"
              title="Se serve, segnala lo smarrimento"
              desc="Dal profilo o in modalità rapida: pubblica l’annuncio completo."
            />
            <Step
              n="3"
              title="Diffondi e ritrova"
              desc="Condividi l’annuncio e raccogli segnalazioni reali."
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/identita/nuovo"
              className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Crea profilo animale
            </Link>
            <Link
              href="/smarrimenti/nuovo"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Pubblica smarrimento
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mx-auto mt-12 max-w-5xl px-4 pb-14">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Impresa responsabile
          </h2>

          <p className="mt-4 max-w-3xl text-zinc-700">
            <span className="font-semibold">
              “UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà reinvestita nel progetto
              e una parte devolverà valore al mondo animale.”
            </span>
          </p>

          <p className="mt-4 max-w-3xl text-sm text-zinc-600">
            Nota: UNIMALIA non sostituisce i documenti ufficiali. L’identità digitale è uno strumento pratico e
            utile, pensato per la gestione quotidiana e per le emergenze (smarrimenti).
          </p>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  desc,
  badge,
}: {
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
          {badge}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-700">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
          {n}
        </span>
        <p className="text-base font-semibold">{title}</p>
      </div>
      <p className="mt-3 text-sm text-zinc-700">{desc}</p>
    </div>
  );
}
