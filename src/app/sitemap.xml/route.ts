const SITE_URL = "https://www.unimalia.it";

type SitemapUrl = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

const CITY_SLUGS = [
  "firenze",
  "milano",
  "roma",
  "torino",
  "bologna",
  "napoli",
  "genova",
  "verona",
  "padova",
  "palermo",
];

const BASE_URLS: SitemapUrl[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },

  { path: "/smarrimenti", changefreq: "daily", priority: "0.95" },
  { path: "/smarrimento", changefreq: "weekly", priority: "0.85" },
  { path: "/trovati", changefreq: "daily", priority: "0.90" },
  { path: "/ritrovati", changefreq: "weekly", priority: "0.80" },

  { path: "/identita", changefreq: "weekly", priority: "0.85" },
  { path: "/servizi", changefreq: "weekly", priority: "0.85" },

  { path: "/smarriti/animale-smarrito-cosa-fare", changefreq: "weekly", priority: "0.90" },

  { path: "/identita-animale/cos-e-identita-animale-digitale", changefreq: "weekly", priority: "0.85" },
  { path: "/identita-animale/come-registrare-un-animale", changefreq: "weekly", priority: "0.85" },
  { path: "/identita-animale/microchip-vs-identita-digitale", changefreq: "weekly", priority: "0.85" },

  { path: "/privacy", changefreq: "monthly", priority: "0.30" },
  { path: "/cookie", changefreq: "monthly", priority: "0.30" },
  { path: "/termini", changefreq: "monthly", priority: "0.30" },
];

const DOG_CITY_URLS: SitemapUrl[] = CITY_SLUGS.map((slug) => ({
  path: `/smarriti/cane-smarrito/${slug}`,
  changefreq: "weekly",
  priority: "0.80",
}));

const CAT_CITY_URLS: SitemapUrl[] = CITY_SLUGS.map((slug) => ({
  path: `/smarriti/gatto-smarrito/${slug}`,
  changefreq: "weekly",
  priority: "0.80",
}));

const URLS = [...BASE_URLS, ...DOG_CITY_URLS, ...CAT_CITY_URLS];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const lastmod = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join("\n")}
</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}