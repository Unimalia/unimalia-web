import type { Metadata } from "next";
import Link from "next/link";
import AuthButtons from "../_components/AuthButtons";

export const metadata: Metadata = {
  title: "UNIMALIA • Professionisti",
  description: "Portale professionisti UNIMALIA",
};

export default function ProfessionistiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/professionisti" className="flex items-center gap-3">
            <img src="/logo.png" alt="UNIMALIA" className="h-10 w-auto" />
            <span className="hidden text-sm font-semibold text-zinc-800 sm:inline">
              Portale Professionisti
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
              <Link
                href="/professionisti"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Dashboard
              </Link>

              <Link
                href="/professionisti/scansiona"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Scansiona
              </Link>

              <Link
                href="/professionisti/skill"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Skill
              </Link>
            </nav>

            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="mt-14 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-zinc-500 sm:px-6">
          © {new Date().getFullYear()} UNIMALIA • Portale Professionisti
        </div>
      </footer>
    </div>
  );
}
