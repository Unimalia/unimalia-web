import Link from "next/link";

export const metadata = {
  title: "Email confermata | UNIMALIA",
  description: "La tua email è stata confermata correttamente.",
};

export default function AuthConfirmedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-4 py-12">
      <div className="w-full rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
          Email confermata ✅
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Benvenuto in UNIMALIA
        </h1>

        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          Il tuo account è stato confermato correttamente. Ora puoi continuare in sicurezza
          e accedere alla piattaforma.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/identita"
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Continua
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Vai al login
          </Link>
        </div>
      </div>
    </main>
  );
}