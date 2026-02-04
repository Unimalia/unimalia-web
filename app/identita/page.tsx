export default function IdentitaPage() {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Identità animale</h1>

      <p className="mt-4 max-w-2xl text-zinc-700">
        Registra l’identità del tuo animale per essere pronto in caso di smarrimento.
        In futuro, questo profilo potrà diventare l’hub centrale tra animale, padrone
        e professionisti.
      </p>

      <div className="mt-8 max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">
          Smarrimenti sempre gratuiti. L’identità animale sarà disponibile con una piccola
          quota annuale.
        </p>

        <button className="mt-4 rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800">
          Crea identità animale
        </button>
      </div>
    </main>
  );
}
