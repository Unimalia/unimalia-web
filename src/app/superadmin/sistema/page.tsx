import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CoreSettings = {
  emergency_mode?: boolean;
  maintenance_mode?: boolean;
  public_registration_enabled?: boolean;
  professional_registration_enabled?: boolean;
  lost_found_enabled?: boolean;
  public_search_enabled?: boolean;
  consults_enabled?: boolean;
  owner_access_requests_enabled?: boolean;
};

type SystemSettingsRow = {
  id: string;
  key: string;
  value_json: CoreSettings | null;
  description: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  name,
  label,
  description,
  checked,
  danger = false,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  danger?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${danger ? "text-rose-700" : "text-zinc-900"}`}>{label}</div>
        <div className="mt-1 text-sm leading-relaxed text-zinc-600">{description}</div>
      </div>

      <div className="shrink-0">
        <input type="hidden" name={name} value="false" />
        <input
          type="checkbox"
          name={name}
          value="true"
          defaultChecked={checked}
          className="mt-1 h-5 w-5 rounded border-zinc-300"
        />
      </div>
    </label>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("it-IT");
}

export default async function SuperAdminSistemaPage() {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("system_settings")
    .select("id,key,value_json,description,updated_at,updated_by")
    .eq("key", "core")
    .maybeSingle();

  const settings = (data as SystemSettingsRow | null)?.value_json || {};
  const row = (data as SystemSettingsRow | null) || null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Controllo sistema</Badge>
            {settings.emergency_mode ? <Badge tone="danger">ModalitÃ  emergenza attiva</Badge> : <Badge tone="success">Sistema normale</Badge>}
            {settings.maintenance_mode ? <Badge tone="warning">ModalitÃ  manutenzione attiva</Badge> : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Sistema, flag e modalitÃ  emergenza
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Questa sezione governa i flag globali del sistema. Qui prepariamo la base funzionale per
            modalitÃ  emergenza, manutenzione e controllo progressivo delle funzioni pubbliche e cliniche.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore caricamento system_settings: {error.message}
            </div>
          ) : null}

          {!row ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Record <strong>core</strong> non trovato in <code>system_settings</code>. Esegui prima lo SQL iniziale.
            </div>
          ) : null}
        </div>
      </section>

      <Section
        title="Flag globali core"
        description="Qui controlli lo stato operativo generale di UNIMALIA. Per ora Ã¨ una base funzionale; lâ€™hardening e lâ€™enforcement profondo saranno rifiniti nella chat sicurezza."
      >
        <form action="/api/superadmin/system/update" method="post" className="space-y-4">
          <input type="hidden" name="redirectTo" value="/superadmin/sistema" />

          <div className="grid gap-4">
            <ToggleRow
              name="emergency_mode"
              label="ModalitÃ  emergenza"
              description="ModalitÃ  protetta del sistema. Base per mantenere operative le aree cliniche mentre il resto viene limitato in caso di attacco o traffico anomalo."
              checked={settings.emergency_mode === true}
              danger
            />

            <ToggleRow
              name="maintenance_mode"
              label="ModalitÃ  manutenzione"
              description="ModalitÃ  manutenzione generale. Utile per bloccare temporaneamente funzioni durante operazioni controllate."
              checked={settings.maintenance_mode === true}
            />

            <ToggleRow
              name="public_registration_enabled"
              label="Registrazione pubblica utenti"
              description="Abilita o disabilita i flussi di registrazione pubblica lato owner/pubblico."
              checked={settings.public_registration_enabled !== false}
            />

            <ToggleRow
              name="professional_registration_enabled"
              label="Registrazione professionisti"
              description="Abilita o disabilita nuovi ingressi nella rete professionale."
              checked={settings.professional_registration_enabled !== false}
            />

            <ToggleRow
              name="lost_found_enabled"
              label="Smarrimenti e ritrovamenti"
              description="Controlla la disponibilitÃ  dei flussi pubblici legati a smarrimenti e ritrovamenti."
              checked={settings.lost_found_enabled !== false}
            />

            <ToggleRow
              name="public_search_enabled"
              label="Ricerca pubblica"
              description="Controlla ricerche e discovery pubbliche non cliniche."
              checked={settings.public_search_enabled !== false}
            />

            <ToggleRow
              name="consults_enabled"
              label="Consulti tra professionisti"
              description="Controlla il modulo consulti professionista â†’ professionista."
              checked={settings.consults_enabled !== false}
            />

            <ToggleRow
              name="owner_access_requests_enabled"
              label="Richieste accesso owner â†’ professionisti"
              description="Controlla il flusso di richieste accesso agli animali."
              checked={settings.owner_access_requests_enabled !== false}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Salva impostazioni sistema
            </button>
          </div>
        </form>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Stato operativo corrente"
          description="Lettura rapida dei flag principali."
        >
          <div className="flex flex-wrap gap-2">
            {settings.emergency_mode ? <Badge tone="danger">ModalitÃ  emergenza: ON</Badge> : <Badge tone="success">ModalitÃ  emergenza: OFF</Badge>}
            {settings.maintenance_mode ? <Badge tone="warning">Manutenzione: ON</Badge> : <Badge tone="success">Manutenzione: OFF</Badge>}
            {settings.public_registration_enabled !== false ? <Badge tone="success">Registrazione pubblica: ON</Badge> : <Badge tone="danger">Registrazione pubblica: OFF</Badge>}
            {settings.professional_registration_enabled !== false ? <Badge tone="success">Registrazione professionisti: ON</Badge> : <Badge tone="danger">Registrazione professionisti: OFF</Badge>}
            {settings.lost_found_enabled !== false ? <Badge tone="success">Smarrimenti: ON</Badge> : <Badge tone="danger">Smarrimenti: OFF</Badge>}
            {settings.public_search_enabled !== false ? <Badge tone="success">Ricerca pubblica: ON</Badge> : <Badge tone="danger">Ricerca pubblica: OFF</Badge>}
            {settings.consults_enabled !== false ? <Badge tone="success">Consulti: ON</Badge> : <Badge tone="danger">Consulti: OFF</Badge>}
            {settings.owner_access_requests_enabled !== false ? <Badge tone="success">Richieste accesso: ON</Badge> : <Badge tone="danger">Richieste accesso: OFF</Badge>}
          </div>
        </Section>

        <Section
          title="Metadati impostazioni"
          description="Informazioni utili per audit interno e tracciamento operativo."
        >
          <div className="space-y-2 text-sm text-zinc-600">
            <div>Chiave record: {row?.key || "â€”"}</div>
            <div>Ultimo aggiornamento: {formatDateTime(row?.updated_at || null)}</div>
            <div>Ultimo aggiornato da: {row?.updated_by || "â€”"}</div>
            <div>Descrizione: {row?.description || "â€”"}</div>
          </div>
        </Section>
      </div>

      <Section
        title="Uso previsto"
        description="Questa Ã¨ la base funzionale. La chat sicurezza si occuperÃ  poi di enforcement globale, protezione route, Cloudflare, registro attivitÃ  e hardening delle azioni critiche."
      >
        <div className="space-y-3 text-sm text-zinc-600">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <strong>ModalitÃ  emergenza</strong> sarÃ  il punto di attivazione rapido durante incidenti,
            mantenendo operative le aree cliniche e limitando le superfici pubbliche.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <strong>Flag di sistema</strong> serviranno per spegnere o riaccendere moduli specifici senza
            toccare direttamente il codice applicativo.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            Il prossimo step sensato sarÃ  collegare questi flag alle route e ai moduli reali del sistema.
          </div>
        </div>
      </Section>
    </div>
  );
}
