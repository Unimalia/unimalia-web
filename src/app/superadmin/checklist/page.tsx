import Link from "next/link";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Item({
  title,
  status,
  note,
}: {
  title: string;
  status: "ok" | "partial" | "todo";
  note: string;
}) {
  const style =
    status === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "partial"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-zinc-200 bg-zinc-100 text-zinc-700";

  const label = status === "ok" ? "OK" : status === "partial" ? "PARZIALE" : "TODO";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${style}`}>
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{note}</p>
    </div>
  );
}

export default function SuperAdminChecklistPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-700">Checkpoint superadmin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Stato sezione e pre-audit finale
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Questa pagina serve per fare il punto sulla console superadmin prima del passaggio alla
            chat sicurezza e prima dell’audit finale della sezione.
          </p>
        </div>
      </section>

      <Section title="Stato funzionale attuale">
        <div className="grid gap-4 lg:grid-cols-2">
          <Item
            title="Dashboard superadmin"
            status="ok"
            note="Presente con numeri reali e collegamenti rapidi."
          />
          <Item
            title="Gestione professionisti"
            status="ok"
            note="Elenco, filtri, dettaglio singolo, approvazione, rifiuto, ruolo vet, visibilità e revisione."
          />
          <Item
            title="Sincronizzazione accesso"
            status="ok"
            note="Allineamento metadata Auth con lo stato reale del professionista."
          />
          <Item
            title="Skill e tag professionali"
            status="ok"
            note="Visibili nel dettaglio professionista con raggruppamento per macro."
          />
          <Item
            title="Sistema / feature flag"
            status="ok"
            note="Base presente con system_settings, UI e update server-side."
          />
          <Item
            title="Enforcement flag principali"
            status="ok"
            note="Applicato su smarrimenti, nuova registrazione professionisti, consulti e richieste accesso."
          />
          <Item
            title="Registro attività admin"
            status="ok"
            note="Scrittura eventi e pagina dedicata per consultazione."
          />
          <Item
            title="Grant management"
            status="todo"
            note="Blocco ancora da costruire dopo verifica schema reale delle tabelle grant."
          />
        </div>
      </Section>

      <Section title="Preparazione audit / sicurezza">
        <div className="grid gap-4 lg:grid-cols-2">
          <Item
            title="Controlli server-side superadmin"
            status="ok"
            note="Presenti nel layout e nelle API superadmin."
          />
          <Item
            title="Namespace interno non ovvio"
            status="partial"
            note="La logica esiste, ma route e namespace andranno rifiniti nella chat sicurezza."
          />
          <Item
            title="Registro attività"
            status="ok"
            note="Base pronta per hardening e arricchimento futuro con IP, user agent e policy più strette."
          />
          <Item
            title="Modalità emergenza"
            status="partial"
            note="Base settings presente, enforcement profondo ancora da estendere."
          />
          <Item
            title="Hardening Cloudflare / anti-bot / rate limit"
            status="todo"
            note="Fuori da questa chat, da trattare nel passaggio dedicato sicurezza."
          />
          <Item
            title="403 secchi / anti-enumeration / session policy admin"
            status="todo"
            note="Da finalizzare nella chat sicurezza."
          />
        </div>
      </Section>

      <Section title="Accessi rapidi utili">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/superadmin"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Dashboard
          </Link>
          <Link
            href="/superadmin/professionisti"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Professionisti
          </Link>
          <Link
            href="/superadmin/sistema"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Sistema
          </Link>
          <Link
            href="/superadmin/audit"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Registro attività
          </Link>
        </div>
      </Section>
    </div>
  );
}