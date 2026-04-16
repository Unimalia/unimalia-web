import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AuditRow = {
  id: string;
  created_at: string | null;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  meta_json: Record<string, unknown> | null;
};

type SearchParams = Promise<{
  q?: string;
  action?: string;
  target?: string;
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

function formatDateTime(value: string | null) {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("it-IT");
}

function buildHref({
  q,
  action,
  target,
}: {
  q?: string;
  action?: string;
  target?: string;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (action && action !== "all") params.set("action", action);
  if (target && target !== "all") params.set("target", target);

  const query = params.toString();
  return query ? `/superadmin/audit?${query}` : "/superadmin/audit";
}

function extractIp(meta: Record<string, unknown> | null) {
  const value = meta?.ip;
  return typeof value === "string" && value.trim() ? value : "â€”";
}

function extractUserAgent(meta: Record<string, unknown> | null) {
  const value = meta?.user_agent;
  return typeof value === "string" && value.trim() ? value : "â€”";
}

function stringifyMeta(meta: Record<string, unknown> | null) {
  try {
    return JSON.stringify(meta || {}, null, 2);
  } catch {
    return "{}";
  }
}

export default async function SuperAdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;

  const q = String(resolved?.q || "").trim().toLowerCase();
  const actionFilter = String(resolved?.action || "all");
  const targetFilter = String(resolved?.target || "all");

  const admin = supabaseAdmin();

  const [{ data, error }, { count: totalCount }, { count: professionalCount }, { count: systemCount }] =
    await Promise.all([
      admin
        .from("admin_audit_log")
        .select("id,created_at,admin_id,action,target_type,target_id,meta_json")
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("admin_audit_log").select("*", { count: "exact", head: true }),
      admin.from("admin_audit_log").select("*", { count: "exact", head: true }).eq("target_type", "professional"),
      admin.from("admin_audit_log").select("*", { count: "exact", head: true }).eq("target_type", "system_settings"),
    ]);

  const rows = ((data ?? []) as unknown[]) as AuditRow[];

  const actionValues = Array.from(new Set(rows.map((r) => r.action).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "it")
  );
  const targetValues = Array.from(new Set(rows.map((r) => r.target_type).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "it")
  );

  const filtered = rows.filter((row) => {
    const matchesQ =
      !q ||
      row.action.toLowerCase().includes(q) ||
      row.target_type.toLowerCase().includes(q) ||
      String(row.target_id || "").toLowerCase().includes(q) ||
      String(row.admin_id || "").toLowerCase().includes(q) ||
      stringifyMeta(row.meta_json).toLowerCase().includes(q);

    const matchesAction = actionFilter === "all" ? true : row.action === actionFilter;
    const matchesTarget = targetFilter === "all" ? true : row.target_type === targetFilter;

    return matchesQ && matchesAction && matchesTarget;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Registro attivitÃ </Badge>
            <Badge>Ultimi 100 eventi</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            AttivitÃ  superadmin
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Qui puoi leggere gli eventi amministrativi registrati dalla console: approvazioni,
            sincronizzazioni accesso, modifiche di revisione e impostazioni di sistema.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore caricamento registro attivitÃ : {error.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Eventi totali"
          value={String(totalCount ?? 0)}
          description="Numero totale record presenti nel registro admin."
        />
        <StatCard
          title="Eventi professionisti"
          value={String(professionalCount ?? 0)}
          description="Operazioni legate ai profili professionali."
        />
        <StatCard
          title="Eventi sistema"
          value={String(systemCount ?? 0)}
          description="Modifiche alle impostazioni di sistema."
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <form action="/superadmin/audit" className="grid gap-3 lg:grid-cols-[1fr_260px_220px_auto]">
            <input
              type="text"
              name="q"
              defaultValue={resolved?.q || ""}
              placeholder="Cerca per azione, target, ID admin, ID target, metadati"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <select
              name="action"
              defaultValue={actionFilter}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="all">Tutte le azioni</option>
              {actionValues.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              name="target"
              defaultValue={targetFilter}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="all">Tutti i target</option>
              {targetValues.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Applica filtri
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <FilterLink href="/superadmin/audit" active={actionFilter === "all" && targetFilter === "all" && !q}>
              Reset
            </FilterLink>

            <FilterLink
              href={buildHref({ q: resolved?.q, action: "professional_approved", target: targetFilter })}
              active={actionFilter === "professional_approved"}
            >
              Approvazioni
            </FilterLink>

            <FilterLink
              href={buildHref({ q: resolved?.q, action: "professional_sync_auth", target: targetFilter })}
              active={actionFilter === "professional_sync_auth"}
            >
              Sincronizzazione accesso
            </FilterLink>

            <FilterLink
              href={buildHref({ q: resolved?.q, action: actionFilter, target: "system_settings" })}
              active={targetFilter === "system_settings"}
            >
              Solo sistema
            </FilterLink>

            <FilterLink
              href={buildHref({ q: resolved?.q, action: actionFilter, target: "professional" })}
              active={targetFilter === "professional"}
            >
              Solo professionisti
            </FilterLink>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse">
            <thead className="border-b bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Azione</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Metadati</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Nessun evento trovato con i filtri attuali.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t align-top">
                    <td className="px-4 py-4 text-sm text-zinc-600">{formatDateTime(row.created_at)}</td>

                    <td className="px-4 py-4 text-sm">
                      <Badge tone="info">{row.action}</Badge>
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">
                      <div className="font-medium text-zinc-900">{row.target_type}</div>
                      <div className="mt-1 text-xs text-zinc-500">{row.target_id || "â€”"}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">
                      <div>{row.admin_id || "â€”"}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">{extractIp(row.meta_json)}</td>

                    <td className="px-4 py-4 text-xs text-zinc-500">
                      <div className="max-w-[260px] break-words">{extractUserAgent(row.meta_json)}</div>
                    </td>

                    <td className="px-4 py-4">
                      <pre className="max-w-[520px] overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700">
                        {stringifyMeta(row.meta_json)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
