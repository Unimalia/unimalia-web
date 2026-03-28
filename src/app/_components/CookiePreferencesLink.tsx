"use client";

export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={() => {
        // @ts-expect-error iubenda injects _iub on window at runtime
        if (window?._iub?.cs?.api?.openPreferences) window._iub.cs.api.openPreferences();
      }}
      className="text-sm underline underline-offset-4 hover:text-zinc-900"
    >
      Gestisci preferenze cookie
    </button>
  );
}