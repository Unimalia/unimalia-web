export const dynamic = "force-dynamic";

import ProShell from "./_components/ProShell";

export default function ProfessionistiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>
        {`
          body > header {
            display: none !important;
          }

          body > nav {
            display: none !important;
          }

          body > [data-site-header] {
            display: none !important;
          }
        `}
      </style>

      <ProShell>{children}</ProShell>
    </>
  );
}