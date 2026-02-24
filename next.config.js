/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",

              // Script: Next/Vercel live + Google Maps + Iubenda
              "script-src 'self' 'unsafe-inline' https://vercel.live https://maps.googleapis.com https://maps.gstatic.com https://cdn.iubenda.com https://embeds.iubenda.com",

              // ✅ QUI il fix: Iubenda hit/consensi + Supabase + Maps
              "connect-src 'self' https://idb.iubenda.com https://*.iubenda.com https://*.supabase.co https://maps.googleapis.com",

              // Assets
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "font-src 'self' data: https:",

              // Iframe / embed (se usati)
              "frame-src 'self' https://www.iubenda.com https://*.iubenda.com https://www.google.com https://maps.google.com",

              // Clickjacking protection
              "frame-ancestors 'none'"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;