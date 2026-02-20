import Link from "next/link";

export default function AdottaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Adotta</h1>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">
          Qui creeremo un database di animali in adozione (gratuito) dove canili e privati
          potranno pubblicare annunci.
        </p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          In arrivo: lista annunci, filtri (città, specie, età), scheda animale, contatto.
        </div>
      </div>
    </main>
  );
}