import type { ReactNode } from "react";

type PageShellProps = {
  title: string; // H1 (obbligatorio)
  subtitle?: string; // testo normale, non heading
  children: ReactNode;
};

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            {subtitle}
          </p>
        ) : null}
      </header>

      <div className="mt-12">{children}</div>
    </main>
  );
}