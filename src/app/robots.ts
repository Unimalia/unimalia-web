import type { MetadataRoute } from "next";

const SITE_URL = "https://unimalia.it";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/smarrimenti",
          "/smarrimento",
          "/trovati",
          "/ritrovati",
          "/servizi",
          "/identita",
          "/privacy",
          "/cookie",
          "/termini",
        ],
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/billing/",
          "/superadmin/",
          "/env-check",
          "/claim/",
          "/verifica/",
          "/azione/",
          "/a/",
          "/e/",
          "/messaggi-protetti/",
          "/gestisci-annuncio/",
          "/i-miei-annunci",
          "/miei-annunci",
          "/profilo/",
          "/professionisti/dashboard",
          "/professionisti/animali",
          "/professionisti/richieste",
          "/professionisti/impostazioni",
          "/professionisti/scansiona",
          "/professionisti/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
