"use client";

import { useEffect, useState } from "react";

export default function MapsWithConsent({ children }: { children: React.ReactNode }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      // @ts-ignore
      const c = Boolean(window?._iub?.cs?.consent);
      setConsented(c);
    };

    check();

    // Poll leggero: quando l'utente accetta dal banner, lo prendiamo.
    const t = window.setInterval(check, 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!consented) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">
          Per visualizzare la mappa devi accettare i cookie di terze parti (Google Maps).
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Puoi gestire le preferenze e abilitare Google Maps.
        </p>

        <button
          type="button"
          onClick={() => {
            // @ts-ignore
            if (window?._iub?.cs?.api?.openPreferences) window._iub.cs.api.openPreferences();
          }}
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Gestisci preferenze
        </button>
      </div>
    );
  }

  // Se c'è consenso, renderizziamo i tuoi componenti mappa reali (es. <GoogleMap .../>)
  return <>{children}</>;
}