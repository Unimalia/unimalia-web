"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CLAIM_TOKEN_STORAGE_KEY = "unimalia:pending-claim-token";
const CLAIM_EMAIL_STORAGE_KEY = "unimalia:pending-claim-email";

export default function ClaimAnimalPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();

  const tokenFromParams = params?.token;
  const tokenFromQuery = searchParams.get("token") || "";
  const emailFromQuery = (searchParams.get("email") || "").trim().toLowerCase();

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

      const storedEmail =
        typeof window !== "undefined"
          ? sessionStorage.getItem(CLAIM_EMAIL_STORAGE_KEY) || ""
          : "";

      const effectiveToken = token || storedToken;
      const effectiveEmail = emailFromQuery || storedEmail;

      if (!effectiveToken) {
        setMessage("Token invito mancante.");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(CLAIM_TOKEN_STORAGE_KEY, effectiveToken);
        if (effectiveEmail) {
          sessionStorage.setItem(CLAIM_EMAIL_STORAGE_KEY, effectiveEmail);
        }
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        const nextUrl = effectiveEmail
          ? `/claim/${effectiveToken}?email=${encodeURIComponent(effectiveEmail)}`
          : `/claim/${effectiveToken}`;

        const loginUrl = effectiveEmail
          ? `/login?email=${encodeURIComponent(effectiveEmail)}&next=${encodeURIComponent(nextUrl)}`
          : `/login?next=${encodeURIComponent(nextUrl)}`;

        router.replace(loginUrl);
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
        sessionStorage.removeItem(CLAIM_EMAIL_STORAGE_KEY);
      }

      router.replace(`/animali/${json.animalId}`);
    }

    void run();

    return () => {
      active = false;
    };
  }, [token, emailFromQuery, router]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-700">
        {message}
      </div>
    </main>
  );
}