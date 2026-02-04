import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://unimalia.it";

  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/smarrimenti`, lastModified: new Date() },
    { url: `${baseUrl}/ritrovati`, lastModified: new Date() },
    { url: `${baseUrl}/smarrimento`, lastModified: new Date() },
    { url: `${baseUrl}/miei-annunci`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/cookie`, lastModified: new Date() },
    { url: `${baseUrl}/termini`, lastModified: new Date() },
  ];
}
