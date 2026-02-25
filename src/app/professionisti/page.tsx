import Link from "next/link";

function Card({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
          <div className="mt-4 inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white">
            {cta}
          </div>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <span className="text-lg" aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function ProfessionistiDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Dopo la scansione di QR/Barcode si apre la scheda completa dell’animale (già esistente).
          Qui trovi solo strumenti professionali.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Scansiona"
          desc="Apri rapidamente la scheda dell’animale da QR/Barcode."
          href="/professionisti/scansiona"
          cta="Avvia scansione"
        />
        <Card
          title="Richieste"
          desc="Inbox consulti: in attesa, accettate, rifiutate, scadute. Emergenze sempre in cima."
          href="/professionisti/richieste"
          cta="Apri inbox"
        />
        <Card
          title="Animali"
          desc="Storico e ricerca: animali verificati/visitati e accessi recenti."
          href="/professionisti/animali"
          cta="Vai agli animali"
        />
        <Card
          title="Impostazioni"
          desc="Limite richieste, blocco, gestione codice emergenza, profilo."
          href="/professionisti/impostazioni"
          cta="Configura"
        />
      </div>
    </div>
  );
}