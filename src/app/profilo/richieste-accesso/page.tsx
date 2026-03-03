import { createServerSupabaseClient } from "@/lib/supabase/server";
import OwnerRequestsClient from "./OwnerRequestsClient";

export const dynamic = "force-dynamic";

export default async function OwnerRichiesteAccessoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Richieste accesso</h1>
        <p className="mt-2 text-sm text-neutral-600">Devi essere loggato.</p>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("animal_access_requests")
    .select("id, created_at, animal_id, org_id, status, requested_scope")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return <OwnerRequestsClient initialRows={(rows ?? []) as any[]} />;
}