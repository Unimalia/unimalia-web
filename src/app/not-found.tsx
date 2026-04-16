import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Pagina non trovata</h1>
      <p className="mt-3 text-zinc-700">
        Il link potrebbe essere errato oppure la pagina non esiste piÃ¹.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Torna alla Home
        </Link>
        <Link
          href="/smarrimenti"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Vedi smarrimenti
        </Link>
      </div>
    </main>
  );
}
