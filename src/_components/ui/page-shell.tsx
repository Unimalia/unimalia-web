"use client";

import Link from "next/link";

type PageShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  boxed?: boolean;
  backFallbackHref?: string;
  actions?: React.ReactNode;
};

export function PageShell({
  children,
  title,
  subtitle,
  boxed = false,
  backFallbackHref,
  actions,
}: PageShellProps) {
  const content = (
    <>
      {title || subtitle || backFallbackHref || actions ? (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            {backFallbackHref ? (
              <div className="shrink-0">
                <Link
                  href={backFallbackHref}
                  className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                >
                  ? Indietro
                </Link>
              </div>
            ) : null}

            {title || subtitle ? (
              <div className="min-w-0">
                {title ? (
                  <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
                    {title}
                  </h1>
                ) : null}

                {subtitle ? (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5f708a] sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {children}
    </>
  );

  return (
    <div className="container-page py-8">
      {boxed ? (
        <div className="rounded-[2.5rem] border border-[#dde4ec] bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.10)] sm:p-8">
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
}
