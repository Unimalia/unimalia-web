import "./globals.css";
import AuthButtons from "./_components/AuthButtons";

export const metadata = {
  title: "UNIMALIA",
  description: "Il luogo dove ritrovare il tuo animale.",
  openGraph: {
    title: "UNIMALIA",
    description: "Il luogo dove ritrovare il tuo animale.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description: "Il luogo dove ritrovare il tuo animale.",
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
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="UNIMALIA" className="h-30 w-auto" />
              <span className="text-lg font-bold tracking-tight">UNIMALIA</span>
            </a>

            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1">
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
                  href="/miei-annunci"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  I miei annunci
                </a>

                <a
                  href="/identita"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Identità animale
                </a>
              </nav>

              <AuthButtons />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>

        <footer className="mt-14 border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-600">
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
