import Link from "next/link";

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-zinc-500">{title}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{value}</div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
      <div className="mt-5">
        <Link
          href={href}
          className="inline-flex items-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-teal-700">Area interna privata</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Dashboard superadmin
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Questa area servirà per governare approvazione professionisti, stato veterinario,
            revisione dei profili e coerenza degli accessi al portale clinico.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Stato area"
          value="Base attiva"
          description="La struttura iniziale superadmin è pronta e separata dal portale professionisti."
        />
        <StatCard
          title="Focus attuale"
          value="Professionisti"
          description="La prossima pagina utile sarà la revisione di professionisti e veterinari."
        />
        <StatCard
          title="Obiettivo"
          value="Coerenza accessi"
          description="Superare la dipendenza da metadata sparsi e centralizzare il controllo."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ActionCard
          title="Revisione professionisti"
          description="Apri la sezione dedicata a professionisti, veterinari e stato approvazione. Da qui costruiremo la vera dashboard operativa."
          href="/superadmin/professionisti"
          cta="Apri revisione professionisti"
        />

        <ActionCard
          title="Roadmap immediata"
          description="Primo step: elenco professionisti. Secondo step: filtri. Terzo step: approva, rifiuta, imposta veterinario e note revisione."
          href="/superadmin/professionisti"
          cta="Continua da qui"
        />
      </section>
    </div>
  );
}