export default function ProfessionistiImpostazioniPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Impostazioni</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Gestisci profilo professionista, preferenze operative, notifiche e sicurezza del portale.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">PROFILO PROFESSIONISTA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Profilo</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Nome struttura, contatti, indirizzo, categoria, specializzazioni e dati pubblici della scheda.
          </p>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Nome struttura / professionista</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Contatti e riferimenti</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Indirizzo e area operativa</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Specializzazioni / skill</div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">PREFERENZE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Preferenze</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Configurazioni del portale, comportamento operativo e personalizzazioni dell’area professionisti.
          </p>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Vista iniziale dashboard</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Preferenze operative struttura</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Opzioni future del portale</div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">NOTIFICHE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Notifiche</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Gestione avvisi per richieste accesso, consulti, aggiornamenti clinici e attività del portale.
          </p>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Richieste accesso</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Consulti e messaggi</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Aggiornamenti clinici e alert</div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">SICUREZZA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Sicurezza</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sessioni, dispositivi, logout, gestione accessi e controllo dell’account professionale.
          </p>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Sessioni attive</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Dispositivi collegati</div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">Logout e controllo accessi</div>
          </div>
        </section>
      </div>
    </div>
  );
}