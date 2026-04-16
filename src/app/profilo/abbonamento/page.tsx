import { AbbonamentoClient } from "./abbonamento-client";

export const metadata = {
  title: "Abbonamento | UNIMALIA",
};

export default function AbbonamentoPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <AbbonamentoClient />
    </div>
  );
}