import Link from "next/link";

export default function PrezziPage() {
  return (
    <main className="bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-12">

        {/* HEADER */}
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-zinc-200 text-center">
          <h1 className="text-4xl font-bold text-zinc-900">
            UNIMALIA
          </h1>

          <p className="mt-4 text-lg text-zinc-600">
            La piattaforma per gestire in modo semplice, ordinato e sicuro la vita del tuo animale.
          </p>

          <div className="mt-6">
            <p className="text-2xl font-bold text-zinc-900">
              Solo 6€ all’anno
            </p>
            <p className="text-sm text-zinc-500">
              ≈ 0,50€ al mese
            </p>
          </div>

          <p className="mt-4 text-zinc-600 max-w-2xl mx-auto">
            UNIMALIA è utilizzabile gratuitamente.  
            Il piano Premium è pensato per chi vuole il controllo completo: cartella clinica organizzata, promemoria e accesso sempre disponibile alle informazioni.
          </p>
        </header>

        {/* BLOCCO VALORE */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 border shadow-sm">
            <h3 className="font-semibold text-zinc-900">
              Organizzazione
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Tutte le informazioni del tuo animale in un unico posto, sempre ordinate e accessibili.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 border shadow-sm">
            <h3 className="font-semibold text-zinc-900">
              Sicurezza
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Dati sempre disponibili in caso di necessità, anche in situazioni di emergenza.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 border shadow-sm">
            <h3 className="font-semibold text-zinc-900">
              Continuità
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Nessuna perdita di informazioni nel tempo, tutto resta aggiornato e consultabile.
            </p>
          </div>

        </section>

        {/* CONFRONTO */}
        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm border overflow-x-auto">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Confronto piani
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Funzionalità</th>
                <th className="py-2">Free</th>
                <th className="py-2">Premium</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700">

              <tr><td className="py-2">Identità digitale animale</td><td>✅</td><td>✅</td></tr>
              <tr><td className="py-2">Referti via email</td><td>✅</td><td>✅</td></tr>
              <tr><td className="py-2">Accesso emergenza base</td><td>✅</td><td>✅</td></tr>

              <tr><td className="py-2">Cartella clinica completa</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Storico clinico completo</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Ricerca e filtri</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Annotazioni personali</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Multi-proprietario</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Download cartella clinica</td><td>❌</td><td>✅</td></tr>

              <tr><td className="py-2">Promemoria (vaccini, visite)</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Notifiche email automatiche</td><td>❌</td><td>✅</td></tr>

              <tr><td className="py-2">Accesso emergenza avanzato</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Traduzione dati sanitari</td><td>❌</td><td>✅</td></tr>
              <tr><td className="py-2">Storico servizi</td><td>❌</td><td>✅</td></tr>

            </tbody>
          </table>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center">
          <h2 className="text-2xl font-bold text-zinc-900">
            Inizia gratuitamente
          </h2>

          <p className="mt-2 text-zinc-600">
            Puoi usare UNIMALIA subito. Passa al Premium quando vuoi.
          </p>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link
              href="/identita/nuovo"
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Crea identità animale
            </Link>

            <Link
              href="/dashboard"
              className="border px-6 py-3 rounded-xl font-semibold"
            >
              Vai alla piattaforma
            </Link>
          </div>
        </section>

        {/* SUPPORTO */}
        <section className="mt-10 text-center text-sm text-zinc-500">
          <p>
            Supporto:
          </p>
          <p className="mt-1">
            Professionisti: professionisti@unimalia.it
          </p>
          <p>
            Generale: info@unimalia.it
          </p>
        </section>

      </div>
    </main>
  );
}