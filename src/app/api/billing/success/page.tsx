export default function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string };
}) {
  const sessionId = searchParams?.session_id ?? "";

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Pagamento completato ✅</h1>

      <p className="mt-3">
        Se tra qualche secondo non vedi le funzionalità attive, ricarica la pagina o esci/rientra.
      </p>

      {sessionId ? (
        <p className="mt-4 text-sm opacity-80">
          Session ID: <span className="font-mono">{sessionId}</span>
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <a className="underline" href="/">
          Torna alla Home
        </a>
        <a className="underline" href="/account">
          Vai al tuo account
        </a>
      </div>
    </main>
  );
}