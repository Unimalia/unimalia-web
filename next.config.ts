import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    const commonSecurityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
            value:
              "geolocation=(), microphone=(), camera=(), usb=(), payment=()",
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
            value:
              "geolocation=(), microphone=(), camera=(self), usb=(self), payment=()",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          ...commonSecurityHeaders,
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), usb=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});