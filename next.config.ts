import type { NextConfig } from "next";

function cspValue(value: string) {
  // One-line header, no newlines/tabs
  return value.replace(/\s{2,}/g, " ").trim();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    // CSP “enforced” prudente: non rompe (mantiene unsafe-inline).
    // In parallelo: CSP-Report-Only più “seria” con Trusted Types.
    const CSP_ENFORCED = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';
      img-src 'self' data: https:;
      font-src 'self' data:;
      style-src 'self' 'unsafe-inline';
      script-src 'self' 'unsafe-inline' https://vercel.live;
      connect-src 'self' https://*.supabase.co;
      upgrade-insecure-requests;
    `);

    // CSP Report-Only (avanzato): Trusted Types + più restrittiva, ma NON blocca.
    // Serve per vedere cosa romperebbe prima di togliere unsafe-inline.
    const CSP_REPORT_ONLY = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';
      img-src 'self' data: https:;
      font-src 'self' data:;
      style-src 'self' 'unsafe-inline';
      script-src 'self' 'unsafe-inline' https://vercel.live;
      connect-src 'self' https://*.supabase.co;
      require-trusted-types-for 'script';
      upgrade-insecure-requests;
    `);

    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS (ok su Vercel / HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          // COOP (origin isolation base)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

          // Clickjacking
          { key: "X-Frame-Options", value: "DENY" },

          // Extra hardening “safe”
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Nota: COEP può rompere risorse cross-origin (quindi lo evitiamo per ora)
          // CORP: spesso safe, ma se embeddi asset da terzi potrebbe dare problemi.
          // Se vuoi essere ultra conservativo: commenta la riga sotto.
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },

          // Permissions Policy: conservative (niente roba invasiva)
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
          },

          // CSP
          { key: "Content-Security-Policy", value: CSP_ENFORCED },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

export default nextConfig;