import "./globals.css";
import AuthButtons from "./_components/AuthButtons";

export const metadata = {
  title: "UNIMALIA",
  description:
    "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale: smarrimenti, identità digitale, informazioni utili e in futuro servizi dedicati.",
  openGraph: {
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
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
        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
            
            {/* LOGO */}
            <a href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="UNIMALIA"
                className="h-40 w-auto -ml-40"
              />
            </a>

            {/* NAV + AUTH */}
            <div className="flex flex-1 items-center justify-end gap-6">
              
              {/* NAV PUBBLICA */}
              <nav className="flex items-center gap-2">
                <a
                  href="/smarrimenti"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Smarrimenti
                </a>

                <a
                  href="/smarrimento"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Pubblica smarrimento
                </a>

                <a
                  href="/ritrovati"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Ritrovati
                </a>

                <a
                  href="/servizi"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Servizi
                </a>
              </nav>

              <AuthButtons />
            </div>
          </div>
        </header>

        {/* CONTENUTO */}
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-zinc-600">
            <p>
              UNIMALIA nasce come progetto responsabile: una parte dei ricavi
              verrà reinvestita nello sviluppo della piattaforma e nel sostegno
              al mondo animale.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
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

            <p className="mt-6 text-xs text-zinc-500">
              © {new Date().getFullYear()} UNIMALIA
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
