import type { Metadata } from "next";

const SITE_URL = "https://unimalia.it";

function buildAbsoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildIdentityPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: buildAbsoluteUrl(input.path),
    },
    openGraph: {
      title: `${input.title} | UNIMALIA`,
      description: input.description,
      url: buildAbsoluteUrl(input.path),
      siteName: "UNIMALIA",
      locale: "it_IT",
      type: "article",
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | UNIMALIA`,
      description: input.description,
      images: [buildAbsoluteUrl("/logo-512.png")],
    },
  };
}

export function buildIdentityWebPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${buildAbsoluteUrl(input.path)}#webpage`,
    url: buildAbsoluteUrl(input.path),
    name: `${input.title} | UNIMALIA`,
    description: input.description,
    inLanguage: "it-IT",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
  };
}

export function buildIdentityBreadcrumbJsonLd(
  items: Array<{ name: string; item: string }>
) {
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

export function buildIdentityFaqJsonLd(
  items: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}