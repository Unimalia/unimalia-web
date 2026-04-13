import type { Metadata } from "next";
import LietiFineClient from "./LietiFineClient";

export const metadata: Metadata = {
  title: "Lieti Fine",
  description:
    "Scopri i lieti fine pubblicati su UNIMALIA: animali tornati a casa, ritrovati o ricongiunti con la propria famiglia.",
  alternates: {
    canonical: "https://unimalia.it/lieti-fine",
  },
  openGraph: {
    title: "Lieti Fine | UNIMALIA",
    description:
      "Animali tornati a casa, ritrovati o ricongiunti con la propria famiglia: i casi risolti positivamente pubblicati su UNIMALIA.",
    url: "https://unimalia.it/lieti-fine",
    siteName: "UNIMALIA",
    images: ["https://unimalia.it/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lieti Fine | UNIMALIA",
    description:
      "Animali tornati a casa, ritrovati o ricongiunti con la propria famiglia: i casi risolti positivamente pubblicati su UNIMALIA.",
    images: ["https://unimalia.it/logo-512.png"],
  },
};

export default function LietiFinePage() {
  return <LietiFineClient />;
}