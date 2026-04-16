"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PageShell } from "@/_components/ui/page-shell";

type Animal = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  species: string;
  breed: string | null;
  status: string;
  premium_active?: boolean;
  premium_expires_at?: string | null;
};

function isPremiumActive(animal: Animal | null) {
  if (!animal) return false;
  if (!animal.premium_active) return false;
  if (!animal.premium_expires_at) return true;
  return new Date(animal.premium_expires_at).getTime() > new Date().getTime();
}

export default function StoriaAnimalePage() {
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
        router.replace(`/login?next=/identita/${id}/storia`);
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select(
          "id, owner_id, created_at, name, species, breed, status, premium_active, premium_expires_at"
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError("Scheda animale non trovata.");
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

    void load();

    return () => {
      alive = false;
    };
  }, [id, router]);

  const premiumOk = useMemo(() => isPremiumActive(animal), [animal]);

  if (loading) {
    return (
      <PageShell
        title="Storia animale"
        subtitle="Caricamentoâ€¦"
        backFallbackHref={id ? `/identita/${id}` : "/identita"}
      >
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Sto caricando la paginaâ€¦</p>
        </div>
      </PageShell>
    );
  }

  if (error || !animal) {
    return (
      <PageShell
        title="Storia animale"
        backFallbackHref={id ? `/identita/${id}` : "/identita"}
      >
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Scheda animale non trovata."}
        </div>
      </PageShell>
    );
  }

  if (!premiumOk) {
    return (
      <PageShell
        title="Storia animale"
        subtitle={`${animal.name} Â· funzione Premium`}
        backFallbackHref={`/identita/${animal.id}`}
      >
        <div className="space-y-6">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-amber-900">
                  Disponibile con Premium
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-800">
                  La Storia animale raccoglierÃ  gli eventi non clinici del tuo animale:
                  servizi, promemoria, attivitÃ  e appuntamenti pratici. La cartella clinica
                  resta separata e dedicata alla parte sanitaria.
                </p>
              </div>

              <span className="inline-flex items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800">
                Premium
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/prezzi"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
              >
                Vai a Premium
              </Link>

              <Link
                href={`/identita/${animal.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
              >
                Torna alla scheda animale
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              Cosa conterrÃ  Storia animale
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-zinc-700">
              <li>toelettatura e prodotti usati</li>
              <li>pensione, pet sitter e altri servizi non clinici</li>
              <li>promemoria owner e appuntamenti futuri</li>
              <li>timeline pratica della vita dellâ€™animale</li>
              <li>eventi separati dalla cartella clinica veterinaria</li>
            </ul>
          </section>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Storia animale"
      subtitle={`${animal.name}${animal.breed ? ` Â· ${animal.breed}` : ""}`}
      backFallbackHref={`/identita/${animal.id}`}
      actions={
        <Link
          href={`/identita/${animal.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          Torna alla scheda
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Sezione in preparazione
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
                Questa area sarÃ  dedicata alla timeline non clinica del tuo animale:
                servizi, attivitÃ , promemoria e appuntamenti pratici. La parte sanitaria
                resta nella cartella clinica.
              </p>
            </div>

            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Premium attivo
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Contenuti previsti
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Servizi non clinici</p>
              <p className="mt-2 text-sm text-zinc-700">
                Toelettatura, pensione, pet sitter, addestramento e altri eventi pratici.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Promemoria owner</p>
              <p className="mt-2 text-sm text-zinc-700">
                Reminder manuali in attesa dellâ€™integrazione futura con le prenotazioni.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Timeline animale</p>
              <p className="mt-2 text-sm text-zinc-700">
                Una cronologia ordinata e separata dalla cartella clinica veterinaria.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Accessi differenziati</p>
              <p className="mt-2 text-sm text-zinc-700">
                In futuro anche professionisti non clinici potranno scrivere qui con permessi dedicati.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}