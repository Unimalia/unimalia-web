// components/ui/back-button.tsx
"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // se c'è history, back; altrimenti fallback
        try {
          router.back();
        } catch {
          router.push(fallbackHref);
        }
      }}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
    >
      ← Indietro
    </button>
  );
}