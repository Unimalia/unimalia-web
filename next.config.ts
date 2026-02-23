import type { NextConfig } from "next";

function cspValue(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    // CSP ENFORCED (quella vera)
    // - include Trusted Types (così Lighthouse smette di segnalare "missing")
    // - include upgrade-insecure-requests (solo qui, non in Report-Only)
    const CSP_ENFORCED = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';
      img-src 'self' data: https:;
      font-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';
      script-src 'self' 'unsafe-inline' https://vercel.live;
      connect-src 'self' https://*.supabase.co;
      require-trusted-types-for 'script';
      upgrade-insecure-requests;
    `);

    // CSP REPORT-ONLY (opzionale)
    // - togliamo upgrade-insecure-requests per evitare l'errore in console
    // - lasciamo Trusted Types (serve solo come “telemetria” se poi aggiungi report-to/report-uri)
    // Se vuoi zero rumore in console: possiamo rimuovere del tutto questo header.
    const CSP_REPORT_ONLY = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';
      img-src 'self' data: https:;
      font-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';
      script-src 'self' 'unsafe-inline' https://vercel.live;
      connect-src 'self' https://*.supabase.co;
      require-trusted-types-for 'script';
    `);

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },

          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
          },

          { key: "Content-Security-Policy", value: CSP_ENFORCED },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

export default nextConfig;