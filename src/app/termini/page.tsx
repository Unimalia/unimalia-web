export default function TerminiPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Termini di utilizzo</h1>

      <p className="text-zinc-700">
        UNIMALIA è una piattaforma che aiuta a pubblicare e consultare annunci di
        smarrimento/ritrovamento. Usando il sito accetti questi termini.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Responsabilità sui contenuti</h2>
        <p className="text-zinc-700">
          Chi pubblica un annuncio è responsabile delle informazioni inserite e
          garantisce che siano vere e aggiornate (foto, descrizione, contatti).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Uso corretto</h2>
        <ul className="list-disc pl-5 text-zinc-700 space-y-1">
          <li>Niente contenuti falsi o ingannevoli.</li>
          <li>Niente spam, molestie o messaggi abusivi.</li>
          <li>Niente dati sensibili non necessari.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Moderazione</h2>
        <p className="text-zinc-700">
          UNIMALIA può rimuovere annunci o limitare account in caso di abuso,
          violazioni o segnalazioni attendibili.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Limitazione di responsabilità</h2>
        <p className="text-zinc-700">
          UNIMALIA fornisce uno strumento di pubblicazione e contatto, ma non può
          garantire il ritrovamento dell’animale né verificare sempre in tempo
          reale tutte le informazioni pubblicate.
        </p>
      </section>

      <p className="text-xs text-zinc-500">
        Versione iniziale — aggiorneremo i termini con l’evoluzione del progetto.
      </p>
    </main>
  );
}
