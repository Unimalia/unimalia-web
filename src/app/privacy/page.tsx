"use client";

import Script from "next/script";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl py-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Privacy Policy
      </h1>

      <p className="mt-3 text-sm text-zinc-600">
        La Privacy Policy è gestita tramite Iubenda.
      </p>

      {/* Iubenda anchor (metodo più compatibile) */}
      <div className="mt-6">
        <a
          href="https://www.iubenda.com/privacy-policy/XXXXXXXX"
          className="iubenda-white iubenda-noiframe iubenda-embed iubenda-nostyle"
          title="Privacy Policy"
        >
          Privacy Policy
        </a>
      </div>

      <Script
        src="https://embeds.iubenda.com/widgets/0c85298b-fa1c-45b8-bd23-ea6bf73aec9c.js"
        strategy="afterInteractive"
      />
    </main>
  );
}