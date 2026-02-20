// _components/ui/back-button.tsx
"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // se la history non c’è, vai al fallback
        try {
          router.back();
          setTimeout(() => {
            // se l’utente è arrivato “diretto” e back non porta da nessuna parte
            // il push al fallback è una rete di sicurezza
            // (non perfetto, ma pratico)
          }, 0);
        } catch {
          router.push(fallbackHref);
        }
      }}
      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
    >
      ← Indietro
    </button>
  );
}