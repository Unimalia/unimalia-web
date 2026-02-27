export default function ScansionaManualePage({
  searchParams,
}: {
  searchParams?: { value?: string };
}) {
  const value = searchParams?.value;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestione manuale</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Il valore inserito non sembra un link/UUID UNIMALIA. Qui decideremo cosa farne.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-zinc-900">Valore inserito</div>
        <div className="mt-2 break-all rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}