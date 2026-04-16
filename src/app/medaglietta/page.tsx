import Link from "next/link";

export default function MedagliettaPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Medaglietta in arrivo
      </h1>

      <p className="mt-4 text-sm text-zinc-600">
        Stiamo preparando un servizio per ordinare medagliette con QR emergenza giÃ  configurato.
      </p>

      <p className="mt-2 text-sm text-zinc-600">
        Saranno resistenti, pronte allâ€™uso e spedite direttamente a casa.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        ðŸ’¡ Nel frattempo puoi generare il QR emergenza e stamparlo liberamente.
      </div>

      <div className="mt-8">
        <Link
          href="/identita"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Torna alle identitÃ 
        </Link>
      </div>
    </div>
  );
}
