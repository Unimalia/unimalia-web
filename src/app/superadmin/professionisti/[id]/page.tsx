import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Professional = {
  id: string;
  created_at: string | null;
  owner_id: string | null;

  approved: boolean | null;
  is_vet: boolean | null;
  public_visible: boolean | null;

  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  legal_name: string | null;

  email: string | null;
  phone: string | null;
  website: string | null;

  category: string | null;
  description: string | null;

  city: string | null;
  province: string | null;
  address: string | null;

  verification_status: string | null;
  verification_level: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;

  subscription_status: string | null;
  subscription_expires_at: string | null;

  is_business: boolean | null;
  vat_number: string | null;
  tax_code: string | null;
  pec: string | null;
  sdi_code: string | null;

  billing_address: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_cap: string | null;

  vet_structure_type: string | null;
  director_name: string | null;
  director_order_province: string | null;
  director_fnovi_number: string | null;

  authorization_code: string | null;
  authorization_issuer: string | null;
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

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-b-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-zinc-900">{value || "—"}</div>
    </div>
  );
}

function ActionButton({
  action,
  professionalId,
  redirectTo,
  label,
  tone = "default",
}: {
  action: string;
  professionalId: string;
  redirectTo: string;
  label: string;
  tone?: "default" | "success" | "danger" | "info";
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50";

  return (
    <form action={action} method="post">
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className={`rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

function getDisplayName(p: Professional) {
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return p.display_name || fullName || p.business_name || p.email || "Professionista";
}

export default async function SuperAdminProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const p = data as Professional;
  const redirectTo = `/superadmin/professionisti/${p.id}`;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Profilo professionista</Badge>
              {p.approved === true ? <Badge tone="success">Approvato</Badge> : null}
              {p.approved === false && p.verification_status === "pending" ? (
                <Badge tone="warning">Da verificare</Badge>
              ) : null}
              {p.approved === false && p.verification_status !== "pending" ? (
                <Badge tone="danger">Rifiutato / non approvato</Badge>
              ) : null}
              {p.is_vet === true ? <Badge tone="info">Veterinario</Badge> : <Badge>Non veterinario</Badge>}
              {p.public_visible === true ? <Badge tone="success">Pubblico</Badge> : <Badge>Non pubblico</Badge>}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              {getDisplayName(p)}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Da qui puoi gestire revisione, stato veterinario, visibilità pubblica e dati di verifica
              del professionista selezionato.
            </p>

            <div className="mt-4 space-y-1 text-sm text-zinc-500">
              <div>ID profilo: {p.id}</div>
              <div>Owner/Auth user: {p.owner_id || "—"}</div>
              <div>Creato il: {p.created_at ? new Date(p.created_at).toLocaleString("it-IT") : "—"}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/superadmin/professionisti"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna all’elenco
            </Link>

            {p.approved !== true ? (
              <ActionButton
                action="/api/superadmin/professionals/approve"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Approva"
                tone="success"
              />
            ) : null}

            {!(p.approved === false && p.verification_status === "rejected") ? (
              <ActionButton
                action="/api/superadmin/professionals/reject"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Rifiuta"
                tone="danger"
              />
            ) : null}

            {p.is_vet !== true ? (
              <ActionButton
                action="/api/superadmin/professionals/set-vet"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Imposta vet"
                tone="info"
              />
            ) : (
              <ActionButton
                action="/api/superadmin/professionals/unset-vet"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Rimuovi vet"
              />
            )}

            {p.public_visible === true ? (
              <ActionButton
                action="/api/superadmin/professionals/unset-visible"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Nascondi pubblicamente"
              />
            ) : (
              <ActionButton
                action="/api/superadmin/professionals/set-visible"
                professionalId={p.id}
                redirectTo={redirectTo}
                label="Rendi pubblico"
                tone="info"
              />
            )}

            <ActionButton
              action="/api/superadmin/professionals/sync-auth"
              professionalId={p.id}
              redirectTo={redirectTo}
              label="Sync Auth"
            />
          </div>
        </div>
      </section>

      <Section title="Stato operativo">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Approved</div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {p.approved === true ? "true" : p.approved === false ? "false" : "null"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Veterinario</div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">{p.is_vet === true ? "true" : "false"}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Visibilità</div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {p.public_visible === true ? "Pubblico" : "Non pubblico"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Verification status</div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">{p.verification_status || "—"}</div>
          </div>
        </div>
      </Section>

      <Section title="Revisione e note admin">
        <form action="/api/superadmin/professionals/update-review" method="post" className="space-y-4">
          <input type="hidden" name="professionalId" value={p.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">Verification status</label>
              <input
                type="text"
                name="verification_status"
                defaultValue={p.verification_status || ""}
                placeholder="es. approved, pending, rejected, draft"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">Verification level</label>
              <input
                type="text"
                name="verification_level"
                defaultValue={p.verification_level || ""}
                placeholder="es. basic, verified, clinic"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">Motivazione / nota revisione</label>
            <textarea
              name="rejection_reason"
              defaultValue={p.rejection_reason || ""}
              rows={5}
              placeholder="Scrivi qui eventuale motivazione di rifiuto, richiesta integrazione documenti o nota interna."
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Salva revisione
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            <div>Verified at: {p.verified_at ? new Date(p.verified_at).toLocaleString("it-IT") : "—"}</div>
            <div className="mt-1">Verified by: {p.verified_by || "—"}</div>
          </div>
        </form>
      </Section>

      <Section title="Dati professionali">
        <div className="grid gap-x-8 md:grid-cols-2">
          <Row label="Display name" value={p.display_name} />
          <Row label="Nome" value={p.first_name} />
          <Row label="Cognome" value={p.last_name} />
          <Row label="Categoria" value={p.category} />
          <Row label="Email" value={p.email} />
          <Row label="Telefono" value={p.phone} />
          <Row label="Sito web" value={p.website} />
          <Row label="Descrizione" value={p.description} />
          <Row label="Città" value={p.city} />
          <Row label="Provincia" value={p.province} />
          <Row label="Indirizzo" value={p.address} />
          <Row label="Business / persona giuridica" value={p.is_business === true ? "Sì" : "No"} />
        </div>
      </Section>

      <Section title="Dati fiscali e fatturazione">
        <div className="grid gap-x-8 md:grid-cols-2">
          <Row label="Business name" value={p.business_name} />
          <Row label="Legal name" value={p.legal_name} />
          <Row label="Partita IVA" value={p.vat_number} />
          <Row label="Codice fiscale" value={p.tax_code} />
          <Row label="PEC" value={p.pec} />
          <Row label="Codice SDI" value={p.sdi_code} />
          <Row label="Billing address" value={p.billing_address} />
          <Row label="Billing city" value={p.billing_city} />
          <Row label="Billing province" value={p.billing_province} />
          <Row label="Billing CAP" value={p.billing_cap} />
        </div>
      </Section>

      <Section title="Dati veterinari / struttura">
        <div className="grid gap-x-8 md:grid-cols-2">
          <Row label="Tipo struttura veterinaria" value={p.vet_structure_type} />
          <Row label="Direttore sanitario" value={p.director_name} />
          <Row label="Ordine provincia direttore" value={p.director_order_province} />
          <Row label="Numero FNOVI direttore" value={p.director_fnovi_number} />
          <Row label="Codice autorizzazione" value={p.authorization_code} />
          <Row label="Ente autorizzazione" value={p.authorization_issuer} />
        </div>
      </Section>

      <Section title="Abbonamento">
        <div className="grid gap-x-8 md:grid-cols-2">
          <Row label="Subscription status" value={p.subscription_status} />
          <Row
            label="Subscription expires at"
            value={p.subscription_expires_at ? new Date(p.subscription_expires_at).toLocaleString("it-IT") : "—"}
          />
        </div>
      </Section>
    </div>
  );
}