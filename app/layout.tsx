import "./globals.css";
import type { Metadata } from "next";
import AuthButtons from "./_components/AuthButtons";

export const metadata: Metadata = {
  title: "UNIMALIA",
  description: "UNIMALIA è un ecosistema per la vita dell’animale: smarrimenti, identità digitale, servizi e adozioni.",
  openGraph: {
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema per la vita dell’animale: smarrimenti, identità digitale, servizi e adozioni.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema per la vita dell’animale: smarrimenti, identità digitale, servizi e adozioni.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
            {/* LOGO */}
            <a href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="UNIMALIA"
                className="h-16 w-auto -ml-10"
              />
            </a>

            {/* NAV + AUTH */}
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
                <a
                  href="/smarrimenti"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Smarrimenti
                </a>

                <a
                  href="/smarrimento"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Pubblica smarrimento
                </a>

                <a
                  href="/ritrovati"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Ritrovati
                </a>

                <a
                  href="/identita"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Identità animale
                </a>

                <a
                  href="/servizi"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Servizi
                </a>

                <a
                  href="/adotta"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Adotta
                </a>
              </nav>

              <AuthButtons />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {children}
        </main>

        <footer className="mt-14 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600 sm:px-8">
            <p>
              UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà
              reinvestita nel progetto e una parte devolverà valore al mondo animale.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <a className="hover:underline" href="/privacy">
                Privacy
              </a>
              <a className="hover:underline" href="/cookie">
                Cookie
              </a>
              <a className="hover:underline" href="/termini">
                Termini
              </a>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              © {new Date().getFullYear()} UNIMALIA
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}