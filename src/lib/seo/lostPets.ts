import type { Metadata } from "next";
import type { SeoCity } from "./cities";

const SITE_URL = "https://unimalia.it";

export function buildAbsoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildLostPetsGuideMetadata(): Metadata {
  const title = "Animale smarrito: cosa fare subito";
  const description =
    "Cosa fare subito se un animale si smarrisce: passaggi utili, errori da evitare, microchip, segnalazione e identità digitale animale con UNIMALIA.";

  return {
    title,
    description,
    alternates: {
      canonical: buildAbsoluteUrl("/smarriti/animale-smarrito-cosa-fare"),
    },
    openGraph: {
      title: `${title} | UNIMALIA`,
      description,
      url: buildAbsoluteUrl("/smarriti/animale-smarrito-cosa-fare"),
      siteName: "UNIMALIA",
      locale: "it_IT",
      type: "article",
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | UNIMALIA`,
      description,
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
  };
}

export function buildDogLostCityMetadata(city: SeoCity): Metadata {
  const title = `Cane smarrito a ${city.name}: cosa fare subito`;
  const description = `Guida pratica su cosa fare se hai un cane smarrito a ${city.name}: passaggi immediati, errori da evitare, microchip, identità digitale animale e segnalazione tramite UNIMALIA.`;

  return {
    title,
    description,
    alternates: {
      canonical: buildAbsoluteUrl(`/smarriti/cane-smarrito/${city.slug}`),
    },
    openGraph: {
      title: `${title} | UNIMALIA`,
      description,
      url: buildAbsoluteUrl(`/smarriti/cane-smarrito/${city.slug}`),
      siteName: "UNIMALIA",
      locale: "it_IT",
      type: "article",
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | UNIMALIA`,
      description,
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
  };
}

export function buildCatLostCityMetadata(city: SeoCity): Metadata {
  const title = `Gatto smarrito a ${city.name}: cosa fare subito`;
  const description = `Guida pratica su cosa fare se hai un gatto smarrito a ${city.name}: passaggi immediati, errori da evitare, microchip, identità digitale animale e segnalazione tramite UNIMALIA.`;

  return {
    title,
    description,
    alternates: {
      canonical: buildAbsoluteUrl(`/smarriti/gatto-smarrito/${city.slug}`),
    },
    openGraph: {
      title: `${title} | UNIMALIA`,
      description,
      url: buildAbsoluteUrl(`/smarriti/gatto-smarrito/${city.slug}`),
      siteName: "UNIMALIA",
      locale: "it_IT",
      type: "article",
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | UNIMALIA`,
      description,
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; item: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function buildFaqJsonLd(
  questions: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildWebPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${buildAbsoluteUrl(input.path)}#webpage`,
    url: buildAbsoluteUrl(input.path),
    name: input.name,
    description: input.description,
    inLanguage: "it-IT",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
  };
}