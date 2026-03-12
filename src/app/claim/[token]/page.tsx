"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CLAIM_TOKEN_STORAGE_KEY = "unimalia:pending-claim-token";

export default function ClaimAnimalPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();

  const tokenFromParams = params?.token;
  const tokenFromQuery = searchParams.get("token") || "";
  const token =
    (tokenFromParams && String(tokenFromParams).trim()) ||
    tokenFromQuery.trim() ||
    "";

  const [message, setMessage] = useState("Verifica invito in corso...");

  useEffect(() => {
    let active = true;

    async function run() {
      const storedToken =
        typeof window !== "undefined"
          ? sessionStorage.getItem(CLAIM_TOKEN_STORAGE_KEY) || ""
          : "";

      const effectiveToken = token || storedToken;

      if (!effectiveToken) {
        setMessage("Token invito mancante.");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(CLAIM_TOKEN_STORAGE_KEY, effectiveToken);
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace(
          `/login?next=${encodeURIComponent(`/claim/${effectiveToken}`)}`
        );
        return;
      }

      const res = await fetch("/api/owner/claim-by-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: effectiveToken }),
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

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(CLAIM_TOKEN_STORAGE_KEY);
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