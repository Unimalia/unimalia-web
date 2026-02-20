// _components/ui/page-shell.tsx
import { Container } from "./container";
import { Card } from "./card";
import { BackButton } from "./back-button";

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  backFallbackHref?: string;
  actions?: React.ReactNode;
  boxed?: boolean;
  children: React.ReactNode;
};

export function PageShell({
  title,
  subtitle,
  back = true,
  backFallbackHref = "/",
  actions,
  boxed = true,
  children,
}: Props) {
  return (
    <main className="bg-zinc-50">
      <Container>
        <div className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              {back ? <BackButton fallbackHref={backFallbackHref} /> : null}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <div className="mt-6">{boxed ? <Card>{children}</Card> : children}</div>
        </div>
      </Container>
    </main>
  );
}