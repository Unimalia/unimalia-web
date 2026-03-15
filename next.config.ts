import type { NextConfig } from "next";

function cspValue(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    const CSP = cspValue(`
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      form-action 'self';

      img-src 'self' data: https: https://*.googleusercontent.com https://*.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com;
      font-src 'self' data: https:;
      style-src 'self' 'unsafe-inline' https://cdn.iubenda.com;

      script-src 'self' 'unsafe-inline'
        https://vercel.live
        https://maps.googleapis.com
        https://maps.gstatic.com
        https://cdn.iubenda.com
        https://embeds.iubenda.com
        https://www.googletagmanager.com
        https://www.google-analytics.com;

      script-src-elem 'self' 'unsafe-inline'
        https://vercel.live
        https://maps.googleapis.com
        https://maps.gstatic.com
        https://cdn.iubenda.com
        https://embeds.iubenda.com
        https://www.googletagmanager.com
        https://www.google-analytics.com;

      connect-src 'self'
        https://*.supabase.co
        https://maps.googleapis.com
        https://*.googleapis.com
        https://maps.gstatic.com
        https://www.google-analytics.com
        https://region1.google-analytics.com
        https://www.googletagmanager.com;

      frame-src 'self'
        https://www.google.com
        https://google.com;

      upgrade-insecure-requests;
    `);

    const commonSecurityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "Content-Security-Policy", value: CSP },
    ];

    return [
      // ✅ EMERGENCY VIEW: no-cache + no-index + camera/usb OFF
      {
        source: "/e/:path*",
        headers: [
          ...commonSecurityHeaders,
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), usb=(), payment=()",
          },
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },

      // ✅ PUBBLICO: super restrittivo (camera/usb OFF)
      {
        source: "/(.*)",
        headers: [
          ...commonSecurityHeaders,
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), usb=(), payment=()",
          },
        ],
      },

      // ✅ PROFESSIONISTI: abilita camera + usb SOLO nel portale
      {
        source: "/professionisti/:path*",
        headers: [
          ...commonSecurityHeaders,
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(self), usb=(self), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
