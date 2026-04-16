import Link from "next/link";

export const metadata = {
  title: "Prezzi UNIMALIA – Piani owner e Premium",
  description:
    "Scopri i piani UNIMALIA per proprietari di animali: versione base gratuita, piano Premium e confronto completo delle funzionalità.",
};

const comparisonRows = [
  {
    label: "Identità animale digitale",
    free: true,
    premium: true,
  },
  {
    label: "Scheda animale sempre accessibile",
    free: true,
    premium: true,
  },
  {
    label: "Gestione delle informazioni essenziali",
    free: true,
    premium: true,
  },
  {
    label: "Referti ricevuti via email",
    free: true,
    premium: true,
  },
  {
    label: "Archivio più ordinato e consultabile",
    free: false,
    premium: true,
  },
  {
    label: "Timeline completa dei contenuti ricevuti",
    free: false,
    premium: true,
  },
  {
    label: "Esperienza più completa per la continuità dell’animale",
    free: false,
    premium: true,
  },
  {
    label: "Promemoria automatici e gestione evoluta",
    free: false,
    premium: true,
  },
  {
    label: "Accesso alle funzioni owner più avanzate",
    free: false,
    premium: true,
  },
  {
    label: "Priorità sulle evoluzioni future dedicate agli owner",
    free: false,
    premium: true,
  },
];

function FeatureIcon({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700">
        ✓
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
      ×
    </span>
  );
}

export default function PrezziPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
              Prezzi UNIMALIA
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
              Prezzi chiari, valore reale per chi vive ogni giorno con il proprio animale
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#55657d] sm:text-lg">
              UNIMALIA è utile fin da subito anche senza abbonamento. Con il piano Premium,
              l’esperienza owner diventa più completa, più ordinata e più evoluta.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
              >
                Attiva Premium
              </Link>

              <Link
                href="/scopri-unimalia"
                className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Scopri come funziona
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Per proprietari
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Il piano pensato per chi vuole più ordine, continuità e valore
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Identità animale, documenti, referti, storico e strumenti evoluti: il piano owner
                Premium è pensato per trasformare UNIMALIA in uno spazio più completo e più utile
                nel tempo.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Per veterinari e professionisti
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Una sezione dedicata arriverà separatamente
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Stiamo costruendo un percorso specifico per cliniche, veterinari e professionisti
                del settore. La sezione prezzi professionisti sarà presentata in una fase dedicata,
                con logiche, accessi e strumenti propri.
              </p>

              <div className="mt-6">
                <Link
                  href="/professionisti"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai all’area professionisti
                </Link>
              </div>
            </div>
          </div>

          <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
                <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                  Piano base
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-[#30486f]">
                  Gratis
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#55657d]">
                  Per iniziare con UNIMALIA e avere subito accesso alle funzionalità essenziali.
                </p>

                <ul className="mt-6 space-y-3 text-sm leading-7 text-[#55657d]">
                  <li>• Identità animale digitale</li>
                  <li>• Scheda animale sempre accessibile</li>
                  <li>• Informazioni essenziali organizzate</li>
                  <li>• Referti ricevuti via email</li>
                </ul>
              </div>

              <div className="rounded-[28px] border border-[#30486f] bg-[linear-gradient(180deg,#30486f_0%,#263b59_100%)] p-6 text-white shadow-[0_18px_40px_rgba(48,72,111,0.22)] sm:p-8">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
                  Piano Premium
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  6€ / anno
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/80">
                  Meno di 50 centesimi al mese per un’esperienza owner più completa, più ordinata e
                  più ricca di valore.
                </p>

                <ul className="mt-6 space-y-3 text-sm leading-7 text-white/85">
                  <li>• Timeline completa della cartella e dei contenuti ricevuti</li>
                  <li>• Archivio più ordinato e consultabile nel tempo</li>
                  <li>• Maggiore continuità nella gestione dell’animale</li>
                  <li>• Promemoria e strumenti evoluti</li>
                  <li>• Accesso alle evoluzioni future dedicate agli owner</li>
                </ul>

                <div className="mt-7">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f4f7fb]"
                  >
                    Scegli Premium
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-4 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-6 lg:p-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                  Confronto owner
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                  Confronta versione base e Premium
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#55657d]">
                  La versione gratuita ti permette di iniziare subito. Il Premium è pensato per chi
                  vuole una gestione più completa, più chiara e più evoluta.
                </p>
              </div>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-[#e3e9f0]">
                <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] border-b border-[#e3e9f0] bg-[#f8fbff]">
                  <div className="px-4 py-4 text-sm font-semibold text-[#30486f] sm:px-6">
                    Funzionalità
                  </div>
                  <div className="px-4 py-4 text-center text-sm font-semibold text-[#5f708a] sm:px-6">
                    Base
                  </div>
                  <div className="px-4 py-4 text-center text-sm font-semibold text-[#30486f] sm:px-6">
                    Premium
                  </div>
                </div>

                {comparisonRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={[
                      "grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center",
                      index !== comparisonRows.length - 1 ? "border-b border-[#eef3f8]" : "",
                      index % 2 === 0 ? "bg-white" : "bg-[#fbfdff]",
                    ].join(" ")}
                  >
                    <div className="px-4 py-4 text-sm leading-6 text-[#55657d] sm:px-6">
                      {row.label}
                    </div>
                    <div className="flex justify-center px-4 py-4 sm:px-6">
                      <FeatureIcon enabled={row.free} />
                    </div>
                    <div className="flex justify-center px-4 py-4 sm:px-6">
                      <FeatureIcon enabled={row.premium} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_28px_rgba(48,72,111,0.05)]">
              <h3 className="text-lg font-semibold text-[#30486f]">Più ordine</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Informazioni, documenti e contenuti del tuo animale restano raccolti in uno spazio
                più chiaro e più semplice da consultare.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_28px_rgba(48,72,111,0.05)]">
              <h3 className="text-lg font-semibold text-[#30486f]">Più continuità</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Nel tempo tutto diventa più facile da ritrovare, seguire e utilizzare quando serve
                davvero, anche nei momenti imprevisti.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_28px_rgba(48,72,111,0.05)]">
              <h3 className="text-lg font-semibold text-[#30486f]">Più valore</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Il Premium rende l’esperienza owner più ricca, più strutturata e più utile nella
                vita quotidiana del tuo animale.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_12px_28px_rgba(48,72,111,0.05)]">
              <h3 className="text-lg font-semibold text-[#30486f]">Più futuro</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Il piano Premium è anche l’accesso alla parte più evoluta dell’esperienza owner e
                alle future funzioni dedicate.
              </p>
            </div>
          </section>

          <section className="mt-10 rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Rete UNIMALIA
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                UNIMALIA resta utile anche senza Premium. Con Premium diventa molto di più.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Anche senza abbonamento continui a ricevere i contenuti essenziali e i referti via
                email quando il veterinario usa UNIMALIA. Con il Premium, però, tutto viene
                organizzato in modo più completo, più consultabile e più comodo nel tempo.
              </p>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Rete UNIMALIA è pensata per costruire continuità tra proprietari, veterinari e
                professionisti, rendendo le informazioni dell’animale più accessibili, ordinate e
                utili.
              </p>
            </div>
          </section>

          <section className="mt-10 rounded-[30px] border border-[#e3e9f0] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.2)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Owner Premium
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Proteggi meglio ciò che conta, con una spesa minima e un valore continuo
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">
                Per 6€ all’anno, il piano Premium rende UNIMALIA più completo, più ordinato e più
                utile nella vita reale del tuo animale.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f4f7fb]"
                >
                  Attiva Premium
                </Link>

                <Link
                  href="/scopri-unimalia"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Approfondisci UNIMALIA
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}