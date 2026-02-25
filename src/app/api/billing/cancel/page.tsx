export default function BillingCancelPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Pagamento annullato</h1>
      <p className="mt-3 text-zinc-700">
        Nessun problema: non è stato effettuato alcun addebito.
      </p>

      <div className="mt-6 flex gap-2">
        <a
          href="/servizi"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Riprova
        </a>
        <a
          href="/"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Torna alla Home
        </a>
      </div>
    </main>
  );
}