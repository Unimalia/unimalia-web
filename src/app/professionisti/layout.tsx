export const dynamic = "force-dynamic";

export default function ProfessionistiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style jsx global>{`
        /* In area professionisti: nascondi SEMPRE l’header pubblico (AppShell) */
        body > header {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}