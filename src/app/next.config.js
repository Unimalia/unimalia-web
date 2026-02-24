// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS (attivalo SOLO se sei sempre in HTTPS: su Vercel sì)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // Clickjacking defense (ridondante con frame-ancestors 'none' ma ok)
          { key: "X-Frame-Options", value: "DENY" },

          // MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Cross-Origin Opener Policy (Lighthouse)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

          // Cross-Origin Resource Policy (buona coppia con COOP)
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },

          // Permissions Policy (stringa “safe default”)
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;