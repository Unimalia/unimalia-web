export default function ProfessionistiImpostazioniPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Impostazioni</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Qui metteremo: profilo professionista, preferenze, notifiche, sicurezza.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Profilo</p>
          <p className="mt-2 text-sm text-zinc-600">Nome struttura, contatti, indirizzo, specializzazioni.</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Sicurezza</p>
          <p className="mt-2 text-sm text-zinc-600">Sessioni, dispositivi, logout, gestione accessi.</p>
        </div>
      </div>
    </div>
  );
}