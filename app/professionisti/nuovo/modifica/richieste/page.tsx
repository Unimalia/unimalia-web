"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  display_name: string;
};

type RequestRow = {
  id: string;
  created_at: string;
  professional_id: string;
  sender_id: string;
  message: string;
};

export default function RichiesteProfessionistaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pro, setPro] = useState<Professional | null>(null);
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // trova la tua scheda
      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select("id,display_name")
        .eq("owner_id", user.id)
        .limit(1);

      if (!alive) return;

      if (proErr || !proData || proData.length === 0) {
        router.replace("/professionisti/nuovo");
        return;
      }

      const p = proData[0] as Professional;
      setPro(p);

      // richieste contatto
      const { data: reqData, error: reqErr } = await supabase
        .from("professional_contact_requests")
        .select("id,created_at,professional_id,sender_id,message")
        .eq("professional_id", p.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (reqErr) {
        setError("Errore nel caricamento delle richieste.");
        setItems([]);
      } else {
        setItems((reqData as RequestRow[]) || []);
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Richieste contatto</h1>
          <p className="mt-2 text-zinc-700">
            {pro ? `Scheda: ${pro.display_name}` : "—"}
          </p>
        </div>

        <Link href="/professionisti" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Portale
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
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">
            Nessuna richiesta al momento.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">
                  Richiesta del {new Date(r.created_at).toLocaleString("it-IT")}
                </p>
                <p className="text-xs text-zinc-500">
                  Mittente: {r.sender_id}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700">
                {r.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
