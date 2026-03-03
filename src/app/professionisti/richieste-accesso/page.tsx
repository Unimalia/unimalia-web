import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import RequestAccessClient from "./RequestAccessClient";

export const dynamic = "force-dynamic";

export default async function ProRichiesteAccessoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = await getProfessionalOrgId();

  if (!user || !orgId) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold">Richieste accesso</h1>
        <p className="mt-2 text-sm text-neutral-600">Non disponibile.</p>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("animal_access_requests")
    .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
    .eq("requested_by", user.id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return <RequestAccessClient initialRows={(rows ?? []) as any[]} />;
}