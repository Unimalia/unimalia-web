export const metadata = {
  title: "Prezzi UNIMALIA â€“ Piano Free e Premium",
  description:
    "Scopri le funzionalitÃ  gratuite e Premium di UNIMALIA: identitÃ  animale digitale, cartella clinica, referti e molto altro.",
};

export default function PrezziPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">
        Piani UNIMALIA
      </h1>

      <p className="mt-4 text-zinc-700">
        UNIMALIA Ã¨ progettato per essere utile fin da subito, anche senza abbonamento.
      </p>

      {/* BLOCCO FREE */}
      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          Versione gratuita
        </h2>

        <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700">
          <li>IdentitÃ  animale digitale per tutti gli animali</li>
          <li>Cartella clinica rapida con dati essenziali</li>
          <li>Referti ricevuti via email (se il veterinario usa UNIMALIA)</li>
          <li>Accesso rapido alle informazioni in caso di necessitÃ </li>
        </ul>

        <p className="mt-4 text-sm text-zinc-600">
          I dati essenziali possono essere inseriti dal veterinario, cosÃ¬ da avere informazioni affidabili e sempre aggiornate.
        </p>
      </section>

      {/* BLOCCO PREMIUM */}
      <section className="mt-6 rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-sm">
        <h2 className="text-xl font-semibold">
          Versione Premium â€“ 6â‚¬ / anno
        </h2>

        <p className="mt-2 text-zinc-300">
          Meno di 50 centesimi al mese per una gestione completa e organizzata.
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
          <li>Timeline completa della cartella clinica</li>
          <li>Archivio organizzato di referti ed eventi</li>
          <li>Storico sempre accessibile</li>
          <li>Promemoria automatici (vaccini, controlli, trattamenti)</li>
          <li>Gestione piÃ¹ completa e ordinata nel tempo</li>
        </ul>
      </section>

      {/* UTILIZZO REALE */}
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          Sempre con te, ovunque
        </h2>

        <p className="mt-3 text-zinc-700">
          Non solo in viaggio: anche durante una semplice passeggiata, avere accesso rapido alle informazioni del tuo animale puÃ² essere utile in caso di imprevisti.
        </p>

        <p className="mt-2 text-zinc-700">
          UNIMALIA rende questi dati sempre disponibili dal tuo telefono, in modo semplice e immediato.
        </p>
      </section>

      {/* RETE */}
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          Rete UNIMALIA
        </h2>

        <p className="mt-3 text-zinc-700">
          I veterinari che fanno parte della Rete UNIMALIA possono inserire e condividere i dati del tuo animale in modo semplice e organizzato.
        </p>

        <p className="mt-2 text-zinc-700">
          Anche senza Premium continuerai a ricevere i referti via email. Con Premium, potrai consultarli in una timeline completa e organizzata.
        </p>

        <p className="mt-4 text-sm text-zinc-600">
          Invita il tuo veterinario nella Rete UNIMALIA.
        </p>

        <p className="text-sm text-zinc-600">
          Se non utilizza ancora la piattaforma, puÃ² contattarci per maggiori informazioni: professionisti@unimalia.it
        </p>
      </section>
    </main>
  );
}
