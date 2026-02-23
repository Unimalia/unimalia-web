import type { NextConfig } from "next";

function cspValue(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    // Base CSP (sempre)
    const CSP_BASE = `
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
    `;

    // ENFORCED
    // - upgrade-insecure-requests solo qui
    // - Trusted Types SOLO in prod (altrimenti Turbopack dev crasha)
    const CSP_ENFORCED = cspValue(`
      ${CSP_BASE}
      ${isProd ? "require-trusted-types-for 'script';" : ""}
      upgrade-insecure-requests;
    `);

    // REPORT-ONLY
    // Se vuoi evitare warning/rumore in console: lo inviamo SOLO in prod.
    // (In dev non serve e genera casino)
    const CSP_REPORT_ONLY = isProd
      ? cspValue(`
          ${CSP_BASE}
          require-trusted-types-for 'script';
        `)
      : "";

    const headers = [
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

      ...(CSP_REPORT_ONLY
        ? [{ key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY }]
        : []),
    ];

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;