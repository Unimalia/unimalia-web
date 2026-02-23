import type { NextConfig } from "next";

function cspValue(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    // CSP: includiamo Google Maps (script/connect/img/frame)
    // e togliamo Trusted Types per evitare errori console e rotture runtime.
    const CSP = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';

      img-src 'self' data: https: https://*.googleusercontent.com https://*.gstatic.com;
      font-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';

      script-src 'self' 'unsafe-inline'
        https://vercel.live
        https://maps.googleapis.com
        https://maps.gstatic.com;

      connect-src 'self'
        https://*.supabase.co
        https://maps.googleapis.com
        https://*.googleapis.com
        https://maps.gstatic.com;

      frame-src 'self'
        https://www.google.com
        https://google.com;

      upgrade-insecure-requests;
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

          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;