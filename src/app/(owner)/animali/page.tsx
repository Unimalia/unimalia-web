import Link from "next/link";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export default async function OwnerAnimaliPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return <div className="p-6">Non autenticato</div>;
  }

  // carico animali dell'owner
  const { data: animals, error: aErr } = await supabase
    .from("animals")
    .select("id, name, chip_code, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (aErr) {
    return <div className="p-6">Errore: {aErr.message}</div>;
  }

  const ids = (animals ?? []).map((a) => a.id);

  // count grants attivi per animale (admin per RLS)
  const admin = supabaseAdmin();
  const { data: grants, error: gErr } = ids.length
    ? await admin
        .from("animal_access_grants")
        .select("animal_id, status, revoked_at")
        .in("animal_id", ids)
        .eq("status", "active")
        .is("revoked_at", null)
    : { data: [], error: null };

  if (gErr) {
    return <div className="p-6">Errore grants: {gErr.message}</div>;
  }

  const countByAnimal = new Map<string, number>();
  for (const g of grants ?? []) {
    countByAnimal.set(g.animal_id, (countByAnimal.get(g.animal_id) ?? 0) + 1);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">I tuoi animali</h1>

      {(!animals || animals.length === 0) ? (
        <p className="text-sm opacity-70">Nessun animale.</p>
      ) : (
        <ul className="space-y-2">
          {animals.map((a) => {
            const n = countByAnimal.get(a.id) ?? 0;
            return (
              <li key={a.id} className="rounded-2xl border p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{a.name ?? "Animale"}</div>
                  <div className="text-sm opacity-70">Chip: {a.chip_code ?? "—"}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm rounded-xl border px-3 py-1">
                    Autorizzazioni: {n}
                  </span>
                  <Link className="rounded-xl bg-black text-white px-3 py-2 text-sm" href={`/animali/${a.id}`}>
                    Apri
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}