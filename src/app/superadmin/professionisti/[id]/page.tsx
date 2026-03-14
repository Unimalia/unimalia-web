import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";

type Professional = {
  id: string;
  created_at: string;

  display_name: string | null;
  first_name: string | null;
  last_name: string | null;

  email: string | null;
  phone: string | null;

  category: string | null;

  city: string | null;
  province: string | null;
  address: string | null;

  approved: boolean | null;
  is_vet: boolean | null;

  verification_status: string | null;

  business_name: string | null;
  vat_number: string | null;

  director_name: string | null;
  director_order_province: string | null;
  director_fnovi_number: string | null;

  vet_structure_type: string | null;
};

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3">
      <div className="text-xs font-semibold text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900">{value ?? "-"}</div>
    </div>
  );
}

export default async function SuperAdminProfessionalDetail({
  params,
}: {
  params: { id: string };
}) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("professionals")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const pro = data as Professional;

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="flex items-start justify-between gap-6 flex-wrap">

          <div>
            <p className="text-sm font-semibold text-teal-700">
              Superadmin · Profilo professionista
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {pro.display_name || `${pro.first_name ?? ""} ${pro.last_name ?? ""}`}
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              ID: {pro.id}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">

            <form action="/api/superadmin/professionals/approve" method="post">
              <input type="hidden" name="professionalId" value={pro.id} />
              <input type="hidden" name="redirectTo" value={`/superadmin/professionisti/${pro.id}`} />

              <button className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Approva
              </button>
            </form>

            <form action="/api/superadmin/professionals/reject" method="post">
              <input type="hidden" name="professionalId" value={pro.id} />
              <input type="hidden" name="redirectTo" value={`/superadmin/professionisti/${pro.id}`} />

              <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Rifiuta
              </button>
            </form>

            {pro.is_vet ? (
              <form action="/api/superadmin/professionals/unset-vet" method="post">
                <input type="hidden" name="professionalId" value={pro.id} />
                <input type="hidden" name="redirectTo" value={`/superadmin/professionisti/${pro.id}`} />

                <button className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-zinc-100">
                  Rimuovi veterinario
                </button>
              </form>
            ) : (
              <form action="/api/superadmin/professionals/set-vet" method="post">
                <input type="hidden" name="professionalId" value={pro.id} />
                <input type="hidden" name="redirectTo" value={`/superadmin/professionisti/${pro.id}`} />

                <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Imposta veterinario
                </button>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* STATO */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Stato profilo
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-xl border p-4">
            <div className="text-xs text-zinc-500">Approvato</div>
            <div className="mt-1 text-sm font-semibold">
              {pro.approved ? "SI" : "NO"}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-zinc-500">Veterinario</div>
            <div className="mt-1 text-sm font-semibold">
              {pro.is_vet ? "SI" : "NO"}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-zinc-500">Verifica</div>
            <div className="mt-1 text-sm font-semibold">
              {pro.verification_status ?? "-"}
            </div>
          </div>

        </div>
      </section>

      {/* DATI PROFESSIONALI */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Dati professionista
        </h2>

        <div className="mt-4 grid md:grid-cols-2 gap-x-8">

          <Row label="Nome visualizzato" value={pro.display_name} />
          <Row label="Categoria" value={pro.category} />
          <Row label="Email" value={pro.email} />
          <Row label="Telefono" value={pro.phone} />
          <Row label="Città" value={pro.city} />
          <Row label="Provincia" value={pro.province} />
          <Row label="Indirizzo" value={pro.address} />

        </div>
      </section>

      {/* STRUTTURA VETERINARIA */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Dati struttura veterinaria
        </h2>

        <div className="mt-4 grid md:grid-cols-2 gap-x-8">

          <Row label="Nome struttura" value={pro.business_name} />
          <Row label="Partita IVA" value={pro.vat_number} />
          <Row label="Tipo struttura" value={pro.vet_structure_type} />

          <Row label="Direttore sanitario" value={pro.director_name} />
          <Row label="Ordine provincia" value={pro.director_order_province} />
          <Row label="Numero FNOVI" value={pro.director_fnovi_number} />

        </div>
      </section>

    </div>
  );
}