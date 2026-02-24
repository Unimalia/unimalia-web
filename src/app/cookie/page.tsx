export default function CookiePage() {
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>

      <p className="text-zinc-700">
        UNIMALIA utilizza cookie tecnici necessari al funzionamento del sito e,
        in futuro, potrebbe utilizzare cookie/strumenti di analisi per migliorare
        l’esperienza.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Cookie tecnici</h2>
        <p className="text-zinc-700">
          Sono cookie indispensabili per login, sicurezza e funzionalità base.
          Senza questi cookie il sito potrebbe non funzionare correttamente.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Cookie di terze parti</h2>
        <p className="text-zinc-700">
          Il sito può integrare servizi esterni (es. mappe). Questi servizi
          possono utilizzare cookie secondo le proprie policy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Gestione cookie</h2>
        <p className="text-zinc-700">
          Puoi gestire i cookie dalle impostazioni del tuo browser. Disabilitare
          alcuni cookie tecnici può impedire l’uso del sito.
        </p>
      </section>

      <p className="text-xs text-zinc-500">
        Versione iniziale — potrà essere aggiornata con l’introduzione di nuove funzionalità.
      </p>
    </main>
  );
}
