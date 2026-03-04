export const dynamic = "force-dynamic";

export default function ProfessionistiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>
        {`
          /* Nasconde header pubblico quando si entra nel portale professionisti */
          body > header {
            display: none !important;
          }
        `}
      </style>

      {children}
    </>
  );
}