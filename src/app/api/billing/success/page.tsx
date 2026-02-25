export default function BillingSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Pagamento completato ✅</h1>
      <p className="mt-3 text-zinc-700">
        Grazie! Il tuo abbonamento verrà attivato automaticamente entro pochi secondi.
      </p>
      <p className="mt-3 text-zinc-700">
        Se non vedi subito le modifiche, aggiorna la pagina o esci e rientra.
      </p>

      <div className="mt-6 flex gap-2">
        <a
          href="/"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Torna alla Home
        </a>
        <a
          href="/profilo"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Vai al profilo
        </a>
      </div>
    </main>
  );
}