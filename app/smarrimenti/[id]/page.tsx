// app/smarrimenti/[id]/page.tsx
import type { Metadata } from "next";
import SmarrimentoDetailClient from "./SmarrimentoDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

function formatItDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // URL della OG image (generata)
  const ogImage = `/smarrimenti/${encodeURIComponent(id)}/opengraph-image`;

  // Metadata “safe” (non dipende dal fetch)
  // Se poi vuoi fare fetch server-side dei dati per personalizzare title/desc,
  // lo facciamo nel prossimo step (serve supabase server client).
  return {
    title: `Smarrimento • UNIMALIA`,
    description:
      "Annuncio smarrimento su UNIMALIA. Condivisione rapida e informazioni essenziali.",
    openGraph: {
      title: `Smarrimento • UNIMALIA`,
      description:
        "Annuncio smarrimento su UNIMALIA. Condivisione rapida e informazioni essenziali.",
      type: "article",
      url: `https://www.unimalia.it/smarrimenti/${encodeURIComponent(id)}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "UNIMALIA • Smarrimento",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Smarrimento • UNIMALIA`,
      description:
        "Annuncio smarrimento su UNIMALIA. Condivisione rapida e informazioni essenziali.",
      images: [ogImage],
    },
  };
}

export default function Page() {
  return <SmarrimentoDetailClient />;
}