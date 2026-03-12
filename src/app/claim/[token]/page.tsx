"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClaimAnimalPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [message, setMessage] = useState("Verifica invito in corso...");

  useEffect(() => {
    let active = true;

    async function run() {
      if (!token) {
        setMessage("Token invito mancante.");
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/claim/${token}`)}`);
        return;
      }

      const res = await fetch("/api/owner/claim-by-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const json = await res.json().catch(() => ({}));

      if (!active) return;

      if (!res.ok) {
        setMessage(json?.error || "Errore durante il collegamento animale.");
        return;
      }

      if (!json?.animalId) {
        setMessage("Collegamento completato ma ID animale mancante.");
        return;
      }

      router.replace(`/animali/${json.animalId}`);
    }

    void run();

    return () => {
      active = false;
    };
  }, [token, router]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-700">
        {message}
      </div>
    </main>
  );
}