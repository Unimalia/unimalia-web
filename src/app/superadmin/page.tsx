import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type ProfessionalRow = {
  id: string;
  created_at: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  category: string | null;
  city: string | null;
  province: string | null;
  approved: boolean | null;
  is_vet: boolean | null;
  public_visible: boolean | null;
  verification_status: string | null;
};

function StatCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300">
      <div className="text-sm font-semibold text-zinc-500">{title}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{value}</div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

function SectionCard({
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
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

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

function getDisplayName(p: ProfessionalRow) {
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return p.display_name || fullName || p.business_name || p.email || "Professionista";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("it-IT");
}

export default async function SuperAdminPage() {
  const supabase = await supabaseServer();

  const [
    { count: totalProfessionals, error: totalError },
    { count: approvedProfessionals, error: approvedError },
    { count: reviewProfessionals, error: reviewError },
    { count: rejectedProfessionals, error: rejectedError },
    { count: vetsCount, error: vetsError },
    { count: publicCount, error: publicError },
    { data: latestProfessionals, error: latestError },
    { data: categoriesRaw, error: categoriesError },
  ] = await Promise.all([
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("approved", true),
    supabase.from("professionals").select("*", { count: "exact", head: true }).is("approved", null),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("approved", false),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("is_vet", true),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("public_visible", true),
    supabase
      .from("professionals")
      .select(
        [
          "id",
          "created_at",
          "display_name",
          "first_name",
          "last_name",
          "business_name",
          "email",
          "category",
          "city",
          "province",
          "approved",
          "is_vet",
          "public_visible",
          "verification_status",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("professionals").select("category"),
  ]);

  const latest = ((latestProfessionals ?? []) as unknown[]) as ProfessionalRow[];
  const categories = ((categoriesRaw ?? []) as Array<{ category: string | null }>)
    .map((row) => row.category?.trim())
    .filter(Boolean) as string[];

  const categoryMap = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .slice(0, 8);

  const hasError =
    totalError ||
    approvedError ||
    reviewError ||
    rejectedError ||
    vetsError ||
    publicError ||
    latestError ||
    categoriesError;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-700">Area interna privata</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Dashboard superadmin
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Questa dashboard mostra una panoramica rapida dei professionisti registrati e offre un
            punto di controllo immediato prima di entrare nella revisione dettagliata.
          </p>

          {hasError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Alcuni dati della dashboard non sono stati caricati correttamente.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Professionisti totali"
          value={String(totalProfessionals ?? 0)}
          description="Numero complessivo dei profili professionali registrati."
          href="/superadmin/professionisti"
        />
        <StatCard
          title="Approvati"
          value={String(approvedProfessionals ?? 0)}
          description="Profili già approvati."
          href="/superadmin/professionisti?status=approved"
        />
        <StatCard
          title="Da verificare"
          value={String(reviewProfessionals ?? 0)}
          description="Profili in attesa di revisione."
          href="/superadmin/professionisti?status=review"
        />
        <StatCard
          title="Rifiutati / non approvati"
          value={String(rejectedProfessionals ?? 0)}
          description="Profili non approvati o rifiutati."
          href="/superadmin/professionisti?status=rejected"
        />
        <StatCard
          title="Veterinari"
          value={String(vetsCount ?? 0)}
          description="Profili con ruolo veterinario."
          href="/superadmin/professionisti?vet=yes"
        />
        <StatCard
          title="Visibili pubblicamente"
          value={String(publicCount ?? 0)}
          description="Profili attualmente visibili nell’area pubblica."
          href="/superadmin/professionisti"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Ultimi professionisti creati"
          description="Accesso rapido agli ultimi profili entrati nel sistema."
        >
          {latest.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              Nessun professionista disponibile.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead className="border-b bg-zinc-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <th className="px-4 py-3">Professionista</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Località</th>
                      <th className="px-4 py-3">Stato</th>
                      <th className="px-4 py-3">Dettaglio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((p) => (
                      <tr key={p.id} className="border-t align-top">
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-zinc-900">{getDisplayName(p)}</div>
                          <div className="mt-1 text-xs text-zinc-500">{p.email || p.id}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            Creato il: {formatDateTime(p.created_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-zinc-600">{p.category || "—"}</td>

                        <td className="px-4 py-4 text-sm text-zinc-600">
                          {[p.city, p.province].filter(Boolean).join(" · ") || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {p.approved === true ? (
                              <Badge tone="success">Approvato</Badge>
                            ) : p.approved === false ? (
                              <Badge tone="danger">Rifiutato</Badge>
                            ) : (
                              <Badge tone="warning">Da verificare</Badge>
                            )}

                            {p.is_vet === true ? <Badge tone="info">Veterinario</Badge> : null}
                            {p.public_visible === true ? <Badge tone="success">Pubblico</Badge> : null}
                            {p.verification_status ? <Badge>{p.verification_status}</Badge> : null}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Categorie più presenti"
          description="Distribuzione rapida dei profili per categoria."
        >
          {topCategories.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              Nessuna categoria disponibile.
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <div className="text-sm font-semibold text-zinc-900">{category}</div>
                  <Badge tone="info">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Accessi rapidi"
          description="Punti di ingresso principali della console."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/superadmin/professionisti"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Revisione professionisti
            </Link>

            <Link
              href="/superadmin/professionisti?status=review"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Solo da verificare
            </Link>

            <Link
              href="/superadmin/professionisti?vet=yes"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Solo veterinari
            </Link>

            <Link
              href="/superadmin/professionisti?status=approved"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Solo approvati
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Stato console"
          description="Promemoria operativo della sezione superadmin."
        >
          <div className="space-y-3 text-sm text-zinc-600">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              La console gestisce già la revisione dei professionisti, il ruolo veterinario, la
              visibilità pubblica e la sincronizzazione degli accessi.
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              Il prossimo blocco sensato è aggiungere funzioni sistemiche come flag di sistema,
              impostazioni globali e modalità emergenza.
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              La parte di hardening, registro attività, Cloudflare e protezione avanzata verrà poi
              portata nella chat sicurezza dedicata.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}