// app/profilo/abbonamento/page.tsx
import { AbbonamentoClient } from "./abbonamento-client";

export const metadata = {
  title: "Abbonamento | UNIMALIA",
};

export default function AbbonamentoPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <AbbonamentoClient />
    </div>
  );
}