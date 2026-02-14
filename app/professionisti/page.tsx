"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
  approved: boolean;
  display_name: string;
  category: string;
  city: string;
  province: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
};

function macroLabel(key: string) {
  switch (key) {
    case "veterinari":
      return "Veterinari";
    case "toelettatura":
      return "Toelettatura";
    case "pensione":
      return "Pensioni";
    case "pet_sitter":
      return "Pet sitter & Dog walking";
    case "addestramento":
      return "Addestramento";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "altro":
    default:
      return "Altro";
  }
}

export default function ProfessionistiDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Professional | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("professionals")
        .select(
          "id,owner_id,approved,display_name,category,city,province,subscription_status,subscription_expires_at"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (error) {
        setError("Errore nel caricamento. Riprova.");
        setItem(null);
      } else {
        setItem((data?.[0] as Professional) ?? null);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portale Professionisti</h1>
          <p className="mt-3 max-w-2xl text-zinc-700">
            Gestisci la tua scheda, le competenze (skill) e le richieste contatto.
          </p>
        </div>

        <Link href="/servizi" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Vai ai Servizi
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Caricamento…</p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : !item ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Non hai ancora creato una scheda professionista.</p>

          <Link
            href="/professionisti/nuovo"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Crea la mia scheda
          </Link>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: la scheda sarà visibile pubblicamente solo dopo approvazione.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-zinc-500">LA TUA SCHEDA</p>
                <h2 className="mt-2 text-xl font-bold">{item.display_name}</h2>
                <p className="mt-2 text-sm text-zinc-700">
                  {macroLabel(item.category)} • {item.city}
                  {item.province ? ` (${item.province})` : ""}
                </p>

                <p className="mt-3 text-sm">
                  Stato pubblico:{" "}
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      item.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {item.approved ? "Visibile" : "In revisione"}
                  </span>
                </p>
              </div>

              <Link
                href={`/servizi/${item.id}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Apri scheda pubblica
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {/* Skill */}
              <Link
                href="/professionisti/skill"
                className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Gestisci skill
              </Link>

              {/* Modifica scheda (per ora alias a skill: non rompe) */}
              <Link
                href="/professionisti/modifica"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Modifica scheda
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-zinc-500">ABBONAMENTO</p>

            <p className="mt-3 text-sm text-zinc-700">
              Stato: <span className="font-semibold">{item.subscription_status}</span>
            </p>

            <p className="mt-2 text-sm text-zinc-700">
              Scadenza:{" "}
              <span className="font-semibold">
                {item.subscription_expires_at
                  ? new Date(item.subscription_expires_at).toLocaleDateString("it-IT")
                  : "—"}
              </span>
            </p>

            <p className="mt-4 text-xs text-zinc-500">
              L’abbonamento verrà attivato in futuro. Per ora la scheda serve a farti trovare.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
