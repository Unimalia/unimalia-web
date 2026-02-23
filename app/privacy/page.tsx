"use client";

import Script from "next/script";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl py-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Privacy Policy
      </h1>

      <div className="mt-6">
        <div
          className="iubenda-embed iubenda-nostyle"
          data-iub-purposes="0"
        />
      </div>

      <Script
        src="https://embeds.iubenda.com/widgets/07e113aa-50b7-4a54-a626-63dbdb71aa57.js"
        strategy="afterInteractive"
      />
    </main>
  );
}