import Link from "next/link";
import { Section } from "@/app/_components/Section";
import PageShell from "@/app/_components/PageShell";

export default function PubblicaPage() {
  return (
    <PageShell
      title="Pubblica (rapido)"
      subtitle="Pubblica in 60 secondi e condividi subito su Facebook. Ti inviamo una mail per confermare."
    >
      <Section title="Crea un annuncio veloce">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <form className="grid gap-4 sm:gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo annuncio">
                <select className={input()}>
                  <option value="smarrito">Smarrito</option>
                  <option value="ritrovato">Ritrovato</option>
                </select>
              </Field>

              <Field label="Specie">
                <select className={input()}>
                  <option value="">Seleziona…</option>
                  <option value="cane">Cane</option>
                  <option value="gatto">Gatto</option>
                  <option value="altro">Altro</option>
                </select>
              </Field>
            </div>

            <Field label="Titolo (breve)">
              <input className={input()} placeholder="Es. Smarrito cane nero in zona…" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome animale (opzionale)">
                <input className={input()} placeholder="Es. Rocky" />
              </Field>

              <Field label="Data evento">
                <input type="date" className={input()} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Regione">
                <input className={input()} placeholder="Es. Toscana" />
              </Field>

              <Field label="Provincia">
                <input className={input()} placeholder="Es. FI" />
              </Field>
            </div>

            <Field label="Zona / Comune / Quartiere">
              <input className={input()} placeholder="Es. San Casciano / Greve / Quartiere…" />
            </Field>

            <Field label="Descrizione (opzionale)">
              <textarea
                className={input("min-h-[120px] resize-y")}
                placeholder="Dettagli utili: colore, collare, microchip, ultimo avvistamento…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email (obbligatoria)">
                <input type="email" className={input()} placeholder="nome@email.it" />
              </Field>

              <Field label="Telefono (opzionale)">
                <input className={input()} placeholder="+39…" />
              </Field>
            </div>

            <Field label="Modalità contatto">
              <div className="flex flex-wrap gap-2">
                <label className={chip()}>
                  <input type="radio" name="contact" defaultChecked className="hidden" />
                  Email
                </label>
                <label className={chip()}>
                  <input type="radio" name="contact" className="hidden" />
                  Telefono
                </label>
                <label className={chip()}>
                  <input type="radio" name="contact" className="hidden" />
                  Email + Telefono
                </label>
              </div>
            </Field>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <label className="flex items-start gap-3 text-sm text-zinc-800">
                <input type="checkbox" className="mt-1 h-4 w-4" />
                <span>
                  Accetto l’informativa{" "}
                  <Link className="underline" href="/privacy">
                    privacy
                  </Link>{" "}
                  e autorizzo la pubblicazione dell’annuncio secondo le opzioni selezionate.
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">Dopo l’invio riceverai una mail di conferma.</p>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Pubblica
              </button>
            </div>
          </form>
        </div>
      </Section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      {children}
    </label>
  );
}

function input(extra?: string) {
  return (
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm " +
    "text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none " +
    "focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 " +
    (extra ?? "")
  );
}

function chip() {
  return (
    "inline-flex cursor-pointer items-center rounded-xl border border-zinc-200 bg-white " +
    "px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 " +
    "has-[:checked]:bg-black has-[:checked]:text-white has-[:checked]:border-black"
  );
}