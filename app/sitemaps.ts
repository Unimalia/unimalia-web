import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.unimalia.it'

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/smarrimenti`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ritrovati`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/servizi`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/professionisti`,
      lastModified: new Date(),
    },
  ]
}