// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      {/* HERO */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-600">
              Ecosistema digitale per la vita dell’animale
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              UNIMALIA
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
              Gestisci identità, smarrimenti, adozioni e servizi in un unico posto.
              Serio, umano, costruito per proteggere e valorizzare la vita dell’animale.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/smarrimenti"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Pubblica smarrimento
              </Link>

              <Link
                href="/identita"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Crea identità animale
              </Link>

              <Link
                href="/professionisti"
                className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
              >
                Sei un professionista? →
              </Link>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-zinc-500">
              Nota: UNIMALIA non sostituisce i documenti ufficiali. L’identità digitale è uno
              strumento pratico per la gestione quotidiana e le emergenze.
            </p>
          </div>
        </div>
      </section>

      {/* 4 SEZIONI */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Smarrimenti */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Smarrimenti</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Pubblica uno smarrimento e consulta gli annunci. È la parte più urgente e immediata.
              </p>
              <div className="mt-5">
                <Link
                  href="/smarrimenti"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Vai agli smarrimenti
                </Link>
              </div>
            </div>

            {/* Identità animale */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Identità animale</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Crea la scheda digitale dell’animale: dati, foto e codici identificativi
                (microchip o UNIMALIA ID).
              </p>
              <div className="mt-5">
                <Link
                  href="/identita"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Apri identità animale
                </Link>
              </div>
            </div>

            {/* Servizi */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Servizi</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Trova professionisti e strutture: veterinari, toelettatura, pensioni,
                pet sitter/walking e altro.
              </p>
              <div className="mt-5">
                <Link
                  href="/servizi"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Cerca servizi
                </Link>
              </div>
            </div>

            {/* Adotta */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Adotta</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Una sezione dedicata agli animali in adozione. Annunci gratuiti per associazioni
                e privati (in costruzione).
              </p>
              <div className="mt-5">
                <Link
                  href="/adotta"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Vai ad adotta
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-zinc-600">
              UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà reinvestita
              nel progetto e una parte devolverà valore al mondo animale.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}