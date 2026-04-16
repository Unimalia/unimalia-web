export type SeoCity = {
  slug: string;
  name: string;
  region?: string;
};

export const SEO_CITIES: SeoCity[] = [
  { slug: "firenze", name: "Firenze", region: "Toscana" },
  { slug: "milano", name: "Milano", region: "Lombardia" },
  { slug: "roma", name: "Roma", region: "Lazio" },
  { slug: "torino", name: "Torino", region: "Piemonte" },
  { slug: "bologna", name: "Bologna", region: "Emilia-Romagna" },
  { slug: "napoli", name: "Napoli", region: "Campania" },
  { slug: "genova", name: "Genova", region: "Liguria" },
  { slug: "verona", name: "Verona", region: "Veneto" },
  { slug: "padova", name: "Padova", region: "Veneto" },
  { slug: "palermo", name: "Palermo", region: "Sicilia" },
];

export function getSeoCityBySlug(slug: string) {
  return SEO_CITIES.find((city) => city.slug === slug);
}