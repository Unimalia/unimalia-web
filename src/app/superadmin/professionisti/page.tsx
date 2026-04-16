import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Professional = {
  id: string;
  created_at: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  category: string | null;
  city: string | null;
  province: string | null;
  approved: boolean | null;
  is_vet: boolean | null;
  verification_status: string | null;
  verification_level: string | null;
  public_visible: boolean | null;
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  vet?: string;
}>;

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

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

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
        className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

function buildHref({
  q,
  status,
  vet,
}: {
  q?: string;
  status?: string;
  vet?: string;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  if (vet && vet !== "all") params.set("vet", vet);

  const query = params.toString();
  return query ? `/superadmin/professionisti?${query}` : "/superadmin/professionisti";
}

function matchesSearch(value: string | null, q: string) {
  return String(value || "").toLowerCase().includes(q);
}

function getDisplayName(p: Professional) {
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return p.display_name || fullName || p.business_name || p.email || "â€”";
}

export default async function SuperAdminProfessionistiPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;

  const q = String(resolved?.q || "").trim().toLowerCase();
  const status = String(resolved?.status || "all");
  const vet = String(resolved?.vet || "all");

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("professionals")
    .select(
      [
        "id",
        "created_at",
        "email",
        "display_name",
        "first_name",
        "last_name",
        "business_name",
        "category",
        "city",
        "province",
        "approved",
        "is_vet",
        "verification_status",
        "verification_level",
        "public_visible",
      ].join(",")
    )
    .order("created_at", { ascending: false });

  const professionals = ((data ?? []) as unknown[]) as Professional[];

  const filtered = professionals.filter((p) => {
    const matchesQ =
      !q ||
      matchesSearch(getDisplayName(p), q) ||
      matchesSearch(p.email, q) ||
      matchesSearch(p.city, q) ||
      matchesSearch(p.province, q) ||
      matchesSearch(p.category, q);

    const matchesStatus =
      status === "all"
        ? true
        : status === "approved"
          ? p.approved === true
          : status === "rejected"
            ? p.approved === false && p.verification_status === "rejected"
            : status === "review"
              ? p.approved === false && p.verification_status === "pending"
              : true;

    const matchesVet =
      vet === "all"
        ? true
        : vet === "yes"
          ? p.is_vet === true
          : vet === "no"
            ? p.is_vet !== true
            : true;

    return matchesQ && matchesStatus && matchesVet;
  });

  const approvedCount = professionals.filter((p) => p.approved === true).length;
  const reviewCount = professionals.filter(
    (p) => p.approved === false && p.verification_status === "pending"
  ).length;
  const vetCount = professionals.filter((p) => p.is_vet === true).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-700">Revisione professionisti</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Professionisti registrati
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Filtra rapidamente i profili e accedi al dettaglio completo per revisione, visibilitÃ  e verifica.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore nel caricamento dei dati: {error.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Totale professionisti"
          value={String(professionals.length)}
          description="Numero complessivo dei profili registrati."
        />
        <StatCard
          title="Approvati"
          value={String(approvedCount)}
          description="Profili giÃ  approvati."
        />
        <StatCard
          title="Da verificare"
          value={String(reviewCount)}
          description="Profili in attesa di revisione."
        />
        <StatCard
          title="Veterinari"
          value={String(vetCount)}
          description="Profili con ruolo veterinario."
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <form action="/superadmin/professionisti" className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <input
              type="text"
              name="q"
              defaultValue={resolved?.q || ""}
              placeholder="Cerca per nome, email, cittÃ , provincia o categoria"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="all">Tutti gli stati</option>
              <option value="approved">Approvati</option>
              <option value="review">Da verificare</option>
              <option value="rejected">Rifiutati</option>
            </select>

            <select
              name="vet"
              defaultValue={vet}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="all">Tutti i ruoli</option>
              <option value="yes">Solo veterinari</option>
              <option value="no">Solo non veterinari</option>
            </select>

            <button
              type="submit"
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Applica filtri
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <FilterLink href="/superadmin/professionisti" active={status === "all" && vet === "all" && !q}>
              Reset
            </FilterLink>

            <FilterLink href={buildHref({ q: resolved?.q, status: "review", vet })} active={status === "review"}>
              Solo da verificare
            </FilterLink>

            <FilterLink href={buildHref({ q: resolved?.q, status: "approved", vet })} active={status === "approved"}>
              Solo approvati
            </FilterLink>

            <FilterLink href={buildHref({ q: resolved?.q, status: "rejected", vet })} active={status === "rejected"}>
              Solo rifiutati
            </FilterLink>

            <FilterLink href={buildHref({ q: resolved?.q, status, vet: "yes" })} active={vet === "yes"}>
              Solo veterinari
            </FilterLink>

            <FilterLink href={buildHref({ q: resolved?.q, status, vet: "no" })} active={vet === "no"}>
              Solo non veterinari
            </FilterLink>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1520px] border-collapse">
            <thead className="border-b bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Professionista</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Contatti</th>
                <th className="px-4 py-3">LocalitÃ </th>
                <th className="px-4 py-3">Revisione</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Verifica</th>
                <th className="px-4 py-3">VisibilitÃ </th>
                <th className="px-4 py-3">Azioni rapide</th>
                <th className="px-4 py-3">Dettaglio</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Nessun professionista trovato con i filtri attuali.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const redirectTo = buildHref({
                    q: resolved?.q,
                    status,
                    vet,
                  });

                  return (
                    <tr key={p.id} className="border-t align-top">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-zinc-900">{getDisplayName(p)}</div>
                        <div className="mt-1 text-xs text-zinc-500">{p.id}</div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">{p.category || "â€”"}</td>

                      <td className="px-4 py-4 text-sm text-zinc-600">{p.email || "â€”"}</td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {[p.city, p.province].filter(Boolean).join(" Â· ") || "â€”"}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {p.approved === true ? (
                          <Badge tone="success">Approvato</Badge>
                        ) : p.approved === false && p.verification_status === "pending" ? (
                          <Badge tone="warning">Da verificare</Badge>
                        ) : (
                          <Badge tone="danger">Rifiutato</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {p.is_vet === true ? (
                          <Badge tone="info">Veterinario</Badge>
                        ) : (
                          <Badge>Non veterinario</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-col gap-2">
                          <Badge>{p.verification_status || "â€”"}</Badge>
                          {p.verification_level ? <Badge>{p.verification_level}</Badge> : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {p.public_visible === true ? (
                          <Badge tone="success">Pubblico</Badge>
                        ) : (
                          <Badge>Non pubblico</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            action="/api/superadmin/professionals/sync-auth"
                            professionalId={p.id}
                            redirectTo={redirectTo}
                            label="Sincronizza accesso"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/superadmin/professionisti/${p.id}`}
                          className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                        >
                          Apri dettaglio
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
