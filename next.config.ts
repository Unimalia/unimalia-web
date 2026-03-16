import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
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
    ];

    return [
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
    ];
  },
};

export default nextConfig;