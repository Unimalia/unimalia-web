"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Animal = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  chip_number: string | null;
  microchip_verified: boolean;
  status: string;
  premium_active: boolean;
  premium_expires_at: string | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "lost":
      return "🔴 Smarrito";
    case "found":
      return "🔵 Ritrovato";
    case "home":
    case "safe":
    default:
      return "🟢 A casa";
  }
}

export default function AnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login?next=/identita/" + id);
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError("Profilo non trovato.");
        setAnimal(null);
        setLoading(false);
        return;
      }

      if (data.owner_id !== user.id) {
        router.replace("/identita");
        return;
      }

      setAnimal(data as Animal);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  const premiumOk = useMemo(() => {
    if (!animal) return false;
    if (!animal.premium_active) return false;
    if (!animal.premium_expires_at) return true;
    return new Date(animal.premium_expires_at).getTime() > Date.now();
  }, [animal]);

  if (loading) {
    return (
      <main className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !animal) {
    return (
      <main className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>

          <p className="mt-2 text-zinc-700">
            {animal.species}
            {animal.breed ? ` • ${animal.breed}` : ""}
            {" • "}
            {statusLabel(animal.status)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Creato il{" "}
            {new Date(animal.created_at).toLocaleDateString("it-IT")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/identita/${animal.id}/modifica`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Modifica profilo
          </Link>

          <Link
            href="/identita"
            className="text-sm text-zinc-600 hover:underline"
          >
            ← Torna
          </Link>
        </div>
      </div>

      {/* SEZIONI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Identità</h2>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Nome</dt>
              <dd className="font-medium">{animal.name}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500">Tipo</dt>
              <dd className="font-medium">{animal.species}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500">Razza</dt>
              <dd className="font-medium">{animal.breed || "—"}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500">Colore / segni</dt>
              <dd className="font-medium">{animal.color || "—"}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500">Taglia</dt>
              <dd className="font-medium">{animal.size || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Microchip</h2>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            {animal.chip_number ? (
              <>
                <p className="text-sm font-medium">
                  Microchip: {animal.chip_number}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {animal.microchip_verified
                    ? "Verificato da veterinario ✅"
                    : "Non ancora verificato"}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-600">
                Nessun microchip registrato.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
