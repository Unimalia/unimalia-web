export default function PrivacyPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <p className="text-zinc-700">
        Questa informativa descrive come UNIMALIA tratta i dati personali quando
        usi il sito e i servizi (pubblicazione annunci, contatto proprietario,
        area personale).
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Titolare del trattamento</h2>
        <p className="text-zinc-700">
          UNIMALIA (contatti in fondo alla pagina).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Dati trattati</h2>
        <ul className="list-disc pl-5 text-zinc-700 space-y-1">
          <li>
            <strong>Account:</strong> email e identificativo utente per accesso e
            gestione annunci.
          </li>
          <li>
            <strong>Annunci:</strong> specie, nome (se inserito), descrizione,
            data, zona/luogo e foto.
          </li>
          <li>
            <strong>Contatti:</strong> telefono/email (se inseriti dal
            proprietario nell’annuncio).
          </li>
          <li>
            <strong>Messaggi:</strong> contenuto inviato tramite “Contatta il
            proprietario”.
          </li>
          <li>
            <strong>Dati tecnici:</strong> log di sicurezza e dati tecnici
            necessari al funzionamento (es. IP e device in forma tecnica).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Finalità e basi giuridiche</h2>
        <ul className="list-disc pl-5 text-zinc-700 space-y-1">
          <li>Fornire il servizio e pubblicare/mostrare annunci (contratto).</li>
          <li>Gestire contatti e messaggi tra utenti (contratto/legittimo interesse).</li>
          <li>Prevenire abusi e garantire sicurezza (legittimo interesse).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Conservazione</h2>
        <p className="text-zinc-700">
          I dati vengono conservati per il tempo necessario a fornire il servizio
          e per esigenze di sicurezza/gestione. Un annuncio “ritrovato” può
          restare nello storico (anche a fini di trasparenza e utilità pubblica).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Condivisione dei dati</h2>
        <p className="text-zinc-700">
          I dati sono ospitati su infrastrutture tecniche (es. database e storage)
          necessarie al funzionamento del sito. Non vendiamo i dati personali.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Diritti dell’utente</h2>
        <p className="text-zinc-700">
          Hai diritto di accesso, rettifica, cancellazione, limitazione e
          opposizione nei limiti previsti dalla legge. Puoi contattarci per
          richieste privacy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7. Contatti</h2>
        <p className="text-zinc-700">
          Per richieste: <strong>privacy@unimalia.it</strong> (da attivare).
        </p>
      </section>

      <p className="text-xs text-zinc-500">
        Versione iniziale — aggiorneremo questa pagina man mano che UNIMALIA cresce.
      </p>
    </main>
  );
}
