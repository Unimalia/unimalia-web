import Link from "next/link";
import Image from "next/image";
import AppShellClient from "./AppShellClient";

type NavItem = { href: string; label: string };

const nav: NavItem[] = [
  { href: "/smarrimenti", label: "Smarrimenti" },
  { href: "/trovati", label: "Trovati / Avvistati" },
  { href: "/lieti-fine", label: "Lieti Fine" },
  { href: "/adotta", label: "Adozioni" },
  { href: "/servizi", label: "Servizi" },
  { href: "/identita", label: "Identità animale" },
];

const proHref = "/professionisti/dashboard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-4 sm:py-5 pl-2 sm:pl-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Vai alla home UNIMALIA">
            <Image
              src="/logo-main.png"
              alt="UNIMALIA"
              width={120}
              height={110}
              priority
              className="h-11 w-[48px] sm:h-12 sm:w-[52px]"
            />
          </Link>

          <AppShellClient nav={nav} proHref={proHref} />
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">{children}</main>

      <footer className="mt-14 border-t border-zinc-200 bg-white">
        <div className="container-page py-8 text-sm text-zinc-600">
          <p>
            UNIMALIA nasce come impresa responsabile: una parte dei ricavi verrà reinvestita nel progetto e una parte
            devolverà valore al mondo animale.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link className="hover:underline" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:underline" href="/cookie">
              Cookie
            </Link>
            <Link className="hover:underline" href="/termini">
              Termini
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500">© {new Date().getFullYear()} UNIMALIA</p>
        </div>
      </footer>
    </div>
  );
}