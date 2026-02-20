import Link from "next/link";

const sections = [
  {
    title: "Smarrimenti",
    desc: "Pubblica uno smarrimento e consulta gli annunci. È la parte più urgente e immediata.",
    href: "/smarrimenti",
    cta: "Vai agli smarrimenti",
  },
  {
    title: "Identità animale",
    desc: "Crea la scheda digitale dell’animale: dati, foto e codici identificativi (microchip o UNIMALIA ID).",
    href: "/identita",
    cta: "Apri identità animale",
  },
  {
    title: "Servizi",
    desc: "Trova professionisti e strutture: veterinari, toelettatura, pensioni, pet sitter/walking e altro.",
    href: "/servizi",
    cta: "Cerca servizi",
  },
  {
    title: "Adotta",
    desc: "Una sezione dedicata agli animali in adozione. Annunci gratuiti per canili e privati (in costruzione).",
    href: "/adotta",
    cta: "Vai ad adotta",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      {/* HERO */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          UNIMALIA
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale:
          smarrimenti, identità digitale, informazioni utili e in futuro un collegamento diretto
          con i professionisti.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/smarrimento"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Pubblica smarrimento
          </Link>
          <Link
            href="/smarrimenti"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Vedi smarrimenti
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Nota: UNIMALIA non sostituisce i documenti ufficiali. L’identità digitale è uno strumento
          pratico e utile, pensato per la gestione quotidiana e per le emergenze.
        </p>
      </div>

      {/* SEZIONI */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s.title}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.desc}</p>

            <div className="mt-5">
              <Link
                href={s.href}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                {s.cta}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}