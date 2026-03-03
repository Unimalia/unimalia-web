import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const dynamic = "force-dynamic";

export default async function ProfessionistiDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = await getProfessionalOrgId();

  let managedCount = 0;
  let pendingSentCount = 0;

  if (user && orgId) {
    // Grant attivi: grantee_type='org', grantee_id=orgId, revoked_at null, status active, validità
    const { count: gCount } = await supabase
      .from("animal_access_grants")
      .select("id", { count: "exact", head: true })
      .eq("grantee_type", "org")
      .eq("grantee_id", orgId)
      .is("revoked_at", null)
      .eq("status", "active");

    managedCount = gCount ?? 0;

    const { count: rCount } = await supabase
      .from("animal_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("requested_by", user.id)
      .eq("status", "pending");

    pendingSentCount = rCount ?? 0;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">Hub operativo del Portale Professionisti.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a href="/professionisti/scansiona" className="rounded-xl border bg-white p-4 hover:bg-neutral-50">
          <div className="text-sm font-semibold">Scansiona</div>
          <div className="mt-1 text-sm text-neutral-600">Microchip / QR per aprire rapidamente un animale.</div>
        </a>

        <a href="/professionisti/animali" className="rounded-xl border bg-white p-4 hover:bg-neutral-50">
          <div className="text-sm font-semibold">Animali in gestione</div>
          <div className="mt-1 text-sm text-neutral-600">
            Grant attivi: <span className="font-semibold">{managedCount}</span>
          </div>
        </a>

        <a href="/professionisti/richieste-accesso" className="rounded-xl border bg-white p-4 hover:bg-neutral-50">
          <div className="text-sm font-semibold">Richieste accesso</div>
          <div className="mt-1 text-sm text-neutral-600">
            Pending inviate: <span className="font-semibold">{pendingSentCount}</span>
          </div>
        </a>

        <a href="/professionisti/impostazioni" className="rounded-xl border bg-white p-4 hover:bg-neutral-50">
          <div className="text-sm font-semibold">Impostazioni</div>
          <div className="mt-1 text-sm text-neutral-600">Profilo, organizzazione, preferenze.</div>
        </a>
      </div>
    </div>
  );
}