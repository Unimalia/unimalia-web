import Link from "next/link";

export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5f708a]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-[#30486f]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#30486f]">Termini e condizioni</li>
          </ol>
        </nav>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <header className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Informazioni legali
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Termini e condizioni di utilizzo
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                I presenti Termini e Condizioni disciplinano l’accesso, la navigazione e l’utilizzo
                della piattaforma UNIMALIA e dei servizi ad essa collegati.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#55657d] sm:text-base">
                Accedendo alla piattaforma o utilizzandone le funzionalità, l’utente dichiara di
                aver letto, compreso e accettato integralmente quanto previsto nel presente
                documento.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai alla Privacy Policy
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Torna alla home
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Documento contrattuale
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Regole, responsabilità e funzionamento della piattaforma
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                Questo documento definisce il quadro generale di utilizzo dei servizi UNIMALIA, i
                ruoli della piattaforma, i limiti di responsabilità e le principali regole
                applicabili a utenti e professionisti.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Accesso e utilizzo</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    I termini disciplinano l’uso della piattaforma da parte di proprietari,
                    veterinari, professionisti e altri soggetti ammessi.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Servizi e contenuti</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Il documento regola servizi gratuiti, eventuali servizi premium, contenuti
                    caricati dagli utenti e funzionamento delle varie sezioni della piattaforma.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Responsabilità e limiti</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Sono indicati il ruolo tecnico di UNIMALIA, i limiti di responsabilità e le
                    regole generali di utilizzo del servizio.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-10 space-y-6">
            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                1. Titolare del servizio e dati identificativi
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Il presente sito web e la piattaforma UNIMALIA (di seguito, la “Piattaforma”) sono
                gestiti da:
              </p>
              <div className="mt-4 rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] p-4 text-sm leading-7 text-[#55657d]">
                <p className="font-semibold text-[#30486f]">UNIMALIA S.r.l.s.</p>
                <p>Sede legale: [da inserire dopo costituzione]</p>
                <p>P. IVA / C.F.: [da inserire dopo costituzione]</p>
                <p>PEC: [da inserire dopo attivazione]</p>
                <p>REA: [se applicabile]</p>
                <p>Email: info@unimalia.it</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Fino al completamento della costituzione societaria e dell’assegnazione dei dati
                definitivi, la piattaforma potrà indicare dati provvisori o incompleti che verranno
                aggiornati prima o contestualmente al lancio operativo.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">2. Definizioni</h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ai fini dei presenti Termini e Condizioni, i termini di seguito indicati avranno il
                significato qui attribuito, salvo che dal contesto risulti diversamente:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  <strong>Piattaforma:</strong> il sito web UNIMALIA, le relative applicazioni,
                  pagine, aree riservate, servizi e funzionalità digitali collegate.
                </li>
                <li>
                  <strong>Utente:</strong> qualsiasi soggetto che accede, naviga, utilizza o
                  interagisce con la Piattaforma.
                </li>
                <li>
                  <strong>Proprietario:</strong> il soggetto che registra, gestisce o dichiara di
                  avere la disponibilità di un animale o dei relativi dati.
                </li>
                <li>
                  <strong>Professionista:</strong> il veterinario, la struttura sanitaria, o altro
                  operatore del settore animale presente o attivo sulla Piattaforma.
                </li>
                <li>
                  <strong>Contenuti:</strong> testi, immagini, file, documenti, dati, recapiti,
                  recensioni, referti, segnalazioni, informazioni e qualsiasi altro materiale
                  caricato, trasmesso o pubblicato.
                </li>
                <li>
                  <strong>Servizi:</strong> l’insieme delle funzionalità offerte dalla Piattaforma,
                  gratuite o a pagamento, attive o attivabili nel tempo.
                </li>
                <li>
                  <strong>Servizi Premium:</strong> i servizi o le funzionalità a pagamento o
                  soggetti ad abbonamento, ove disponibili.
                </li>
                <li>
                  <strong>Cartella Clinica Digitale:</strong> l’insieme strutturato di dati, eventi,
                  referti, note, documenti e informazioni sanitarie riferite all’animale.
                </li>
                <li>
                  <strong>Identità Animale:</strong> l’insieme delle informazioni identificative e
                  organizzative dell’animale, anche associate a strumenti digitali quali QR code,
                  barcode o altri identificativi.
                </li>
                <li>
                  <strong>Grant:</strong> l’autorizzazione o il meccanismo tecnico attraverso cui un
                  proprietario può consentire a uno o più professionisti l’accesso a determinati
                  dati o funzionalità.
                </li>
                <li>
                  <strong>Segnalazione:</strong> ogni contenuto pubblicato dall’utente relativo a
                  smarrimento, ritrovamento o altra comunicazione pubblica consentita dalla
                  Piattaforma.
                </li>
                <li>
                  <strong>Adozione:</strong> ogni annuncio, richiesta o pubblicazione relativa
                  all’affidamento o ricerca di affidamento di un animale, ove consentito dalla
                  Piattaforma.
                </li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                3. Natura della piattaforma e ruolo di UNIMALIA
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA è una piattaforma digitale multifunzionale che consente, a titolo
                esemplificativo:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>la creazione e gestione dell’identità digitale dell’animale;</li>
                <li>la gestione, archiviazione e consultazione di informazioni sanitarie e cliniche;</li>
                <li>
                  la connessione tra proprietari, veterinari, strutture e altri professionisti del
                  settore animale;
                </li>
                <li>
                  la pubblicazione di contenuti e annunci, inclusi smarrimenti, ritrovamenti,
                  adozioni e servizi;
                </li>
                <li>
                  la gestione di referti, eventi clinici, promemoria, notifiche e comunicazioni
                  informative.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA agisce esclusivamente come:
              </p>
              <blockquote className="mt-4 rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] px-5 py-4 text-sm italic leading-7 text-[#55657d]">
                piattaforma tecnologica neutrale per la gestione, organizzazione e condivisione di
                informazioni
              </blockquote>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA non è parte delle transazioni tra utenti, non è una struttura sanitaria,
                non è un intermediario contrattuale, non svolge attività di certificazione e non
                sostituisce il rapporto diretto tra utente e professionista.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Salvo quanto eventualmente indicato in modo espresso in specifiche sezioni della
                piattaforma, UNIMALIA non formula diagnosi, non suggerisce terapie, non prende
                decisioni cliniche e non eroga prestazioni veterinarie.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                4. Requisiti soggettivi, utenti e capacità di agire
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Gli utenti della piattaforma possono essere, a seconda delle funzionalità
                disponibili:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>proprietari di animali;</li>
                <li>veterinari e strutture sanitarie;</li>
                <li>altri professionisti del settore animale;</li>
                <li>associazioni, enti o soggetti autorizzati;</li>
                <li>utenti che pubblicano contenuti informativi o annunci, ove consentito.</li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente dichiara di avere la capacità giuridica necessaria per accettare i presenti
                Termini e utilizzare la Piattaforma. L’utilizzo della piattaforma da parte di minori
                o soggetti privi della piena capacità di agire è consentito solo nei limiti di legge
                e sotto la responsabilità del genitore, tutore o altro soggetto legittimato.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ogni utente è responsabile della correttezza, liceità, completezza e aggiornamento
                dei dati inseriti, dichiarati, caricati o condivisi tramite la Piattaforma.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                5. Registrazione, account, credenziali, sospensione e chiusura
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’accesso ad alcune funzionalità può richiedere la creazione di un account. L’utente
                è tenuto a fornire dati veritieri, aggiornati e completi, nonché a mantenerli
                corretti nel tempo.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente è responsabile della custodia delle credenziali, della riservatezza degli
                strumenti di autenticazione e di ogni attività posta in essere tramite il proprio
                account, salvo provi l’uso illecito da parte di terzi non a lui imputabile.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente si impegna a informare tempestivamente UNIMALIA in caso di accesso non
                autorizzato, perdita delle credenziali, sospetto abuso, violazione della sicurezza o
                uso improprio dell’account.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA si riserva il diritto di sospendere, limitare, disabilitare o chiudere,
                anche senza preavviso nei casi più gravi, account o funzionalità in caso di:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>violazione dei presenti Termini;</li>
                <li>uso illecito, fraudolento o abusivo della Piattaforma;</li>
                <li>pubblicazione di contenuti contrari alla legge o ai diritti di terzi;</li>
                <li>
                  condotte che possano arrecare danno a utenti, animali, professionisti, terzi o
                  alla Piattaforma;
                </li>
                <li>necessità tecniche, di sicurezza, di verifica o di tutela legale.</li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                In caso di chiusura dell’account, UNIMALIA potrà conservare i dati nella misura
                necessaria per adempimenti di legge, tutela dei propri diritti, gestione di
                contestazioni, prevenzione di frodi, sicurezza della piattaforma e tracciabilità
                tecnica, secondo quanto previsto dalla normativa applicabile e dalla Privacy Policy.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                6. Sezione Smarrimenti
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA consente agli utenti di pubblicare segnalazioni relative ad animali
                smarriti o ritrovati.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente che pubblica una segnalazione dichiara e garantisce che:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>le informazioni inserite sono veritiere, corrette e aggiornate;</li>
                <li>
                  ha diritto di pubblicare dati, immagini, recapiti e altri contenuti collegati alla
                  segnalazione;
                </li>
                <li>
                  i contenuti non violano diritti di terzi, norme di legge o obblighi di
                  riservatezza;
                </li>
                <li>
                  la segnalazione non ha finalità abusive, diffamatorie, ingannevoli o fraudolente.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">UNIMALIA:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>non garantisce il ritrovamento dell’animale;</li>
                <li>
                  non verifica preventivamente e sistematicamente la veridicità di ogni
                  segnalazione;
                </li>
                <li>
                  non è responsabile dei contatti, delle comunicazioni, degli accordi o delle
                  conseguenze derivanti dalle interazioni tra utenti;
                </li>
                <li>
                  si riserva il diritto di limitare, sospendere, oscurare o rimuovere segnalazioni
                  in caso di abusi, contestazioni, illeciti o fondati motivi di verifica.
                </li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                7. Sezione Adozioni
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA può permettere la pubblicazione di annunci di adozione da parte di
                associazioni, strutture autorizzate e, ove previsto dalle funzionalità disponibili,
                soggetti privati.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Gli annunci di adozione hanno finalità meramente informative e di contatto.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">UNIMALIA:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>non è parte del processo di adozione;</li>
                <li>non effettua controlli sistematici sulle parti coinvolte;</li>
                <li>
                  non garantisce l’idoneità degli adottanti, degli affidanti o dei soggetti che
                  pubblicano gli annunci;
                </li>
                <li>
                  non risponde della veridicità delle informazioni diffuse nelle schede di adozione.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Eventuali contatti, colloqui, valutazioni, verifiche, accordi o transazioni
                avvengono esclusivamente tra le parti coinvolte, che ne assumono piena
                responsabilità.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                8. Sezione Servizi e Professionisti
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Piattaforma può ospitare profili, schede, dati o contenuti riferiti a
                professionisti e operatori del settore animale, quali, a titolo esemplificativo:
                veterinari, pet sitter, pensioni, toelettature, educatori, addestratori e altri
                operatori.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Salvo espressa indicazione contraria resa pubblica in modo specifico da UNIMALIA, la
                presenza di un professionista sulla Piattaforma non costituisce certificazione,
                attestazione di qualità, garanzia di idoneità, approvazione sostanziale o verifica
                completa delle relative competenze, abilitazioni, autorizzazioni o conformità
                normativa.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ove UNIMALIA preveda procedure di onboarding, raccolta documentale, verifica
                preliminare o accesso a una rete professionale, tali attività devono intendersi
                limitate agli scopi tecnici, organizzativi o funzionali della Piattaforma e non
                equivalgono, salvo espressa diversa indicazione, a una certificazione professionale
                piena o a una garanzia sulle prestazioni rese.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">UNIMALIA:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  non garantisce la qualità, disponibilità, continuità o conformità dei servizi
                  offerti dai professionisti;
                </li>
                <li>
                  non assume responsabilità per prestazioni, omissioni, errori o condotte dei
                  professionisti presenti in piattaforma;
                </li>
                <li>
                  non sostituisce la verifica autonoma che l’utente deve compiere su competenze,
                  titoli, abilitazioni, iscrizioni e affidabilità.
                </li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                9. Recensioni e feedback
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ove previste, recensioni e feedback devono essere pubblicati esclusivamente da
                utenti che abbiano avuto un’esperienza reale con il servizio, il professionista o il
                soggetto recensito.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente si impegna a pubblicare recensioni in buona fede, in forma non
                diffamatoria, non ingannevole e rispettosa della legge.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">Tuttavia UNIMALIA:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>non garantisce la veridicità, completezza, oggettività o attualità delle recensioni;</li>
                <li>non è responsabile dei contenuti pubblicati dagli utenti;</li>
                <li>
                  può moderare, sospendere, oscurare o rimuovere recensioni ritenute illecite,
                  offensive, non pertinenti, abusive o non conformi ai presenti Termini.
                </li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                10. Identità animale
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA consente la creazione di un’identità digitale dell’animale, anche in
                assenza di microchip, con strumenti informativi quali QR code, barcode o altri
                sistemi identificativi digitali messi a disposizione dalla Piattaforma.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’identità digitale dell’animale:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  non sostituisce documenti ufficiali, registrazioni obbligatorie o certificazioni
                  previste dalla legge;
                </li>
                <li>
                  non ha valore legale ai fini di viaggi, certificazioni, pratiche amministrative o
                  identificazioni ufficiali, salvo diversa previsione normativa;
                </li>
                <li>
                  costituisce uno strumento informativo, organizzativo e di supporto alla gestione
                  dell’animale.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                È responsabilità dell’utente verificare l’esattezza e l’aggiornamento delle
                informazioni collegate all’identità animale.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                11. Cartella clinica digitale e dati sanitari
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Piattaforma può consentire la gestione di informazioni sanitarie, referti, eventi
                clinici, promemoria e altri contenuti collegati alla salute dell’animale.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                I dati clinici possono essere inseriti o modificati esclusivamente dai professionisti
                autorizzati, salvo eventuali funzionalità specificamente riservate al proprietario o
                ad altri soggetti abilitati.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Cartella Clinica Digitale:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  non sostituisce visita, referto, documentazione veterinaria ufficiale, triage o
                  presa in carico sanitaria;
                </li>
                <li>
                  può contenere dati parziali, storici, incompleti, non aggiornati, non verificati o
                  caricati da terzi;
                </li>
                <li>
                  ha finalità organizzativa, informativa e di supporto alla consultazione, e non
                  costituisce di per sé garanzia di completezza clinica.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA non formula diagnosi, non prescrive trattamenti, non suggerisce terapie e
                non sostituisce il parere del medico veterinario o della struttura sanitaria
                competente.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Il proprietario e il professionista restano responsabili, per quanto di rispettiva
                competenza, della verifica clinica dei dati e delle decisioni assunte. Nessuna
                decisione sanitaria o clinica deve essere basata esclusivamente sulle informazioni
                presenti sulla Piattaforma.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                12. Accesso e condivisione dei dati (Grant)
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’accesso ai dati dell’animale e alle informazioni sanitarie può avvenire tramite
                autorizzazione esplicita del proprietario o tramite altre funzionalità di
                autorizzazione previste dalla Piattaforma.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Il proprietario può, ove previsto:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>concedere accesso a uno o più professionisti;</li>
                <li>
                  revocare l’accesso nei limiti delle funzionalità disponibili e delle operazioni
                  già correttamente effettuate;
                </li>
                <li>gestire le autorizzazioni relative ai propri animali.</li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Gli accessi, le autorizzazioni e le attività rilevanti possono essere tracciati
                tramite sistemi di log, registrazione tecnica, audit trail o altre soluzioni di
                sicurezza e controllo.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                13. Emergenze e accesso rapido
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Piattaforma può consentire, ove disponibile, l’accesso rapido a dati essenziali
                dell’animale.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA non è un servizio di emergenza, non garantisce reperibilità continua, non
                garantisce la completezza, correttezza o tempestività dei dati in situazioni di
                urgenza e non può essere considerata sostitutiva di un contatto immediato con un
                veterinario o una struttura idonea.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                I dati resi accessibili in modalità rapida:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>sono forniti esclusivamente a scopo informativo;</li>
                <li>
                  devono essere verificati da un professionista qualificato prima di qualsiasi
                  valutazione clinica;
                </li>
                <li>
                  non sostituiscono il giudizio sanitario, l’intervento urgente o la documentazione
                  ufficiale.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                In caso di emergenza o urgenza sanitaria, l’utente deve contattare immediatamente un
                medico veterinario o una struttura adeguata.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                14. Comunicazioni e notifiche
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La Piattaforma può inviare comunicazioni relative ai servizi offerti, tra cui, a
                titolo esemplificativo:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>email contenenti referti, riepiloghi o aggiornamenti;</li>
                <li>notifiche informative, tecniche o di sicurezza;</li>
                <li>inviti alla registrazione o al completamento dell’account;</li>
                <li>promemoria sanitari o comunicazioni collegate alle funzionalità attive;</li>
                <li>
                  comunicazioni relative a richieste di accesso, condivisioni dati, scadenze o
                  modifiche del servizio.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente accetta che alcune comunicazioni possano avvenire anche prima della
                registrazione completa, ove ciò sia funzionale all’erogazione del servizio o alla
                corretta gestione della relazione tecnica con la Piattaforma.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                15. Funzionalità gratuite e premium
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA può offrire funzionalità gratuite e, ove previsto, funzionalità premium o
                a pagamento.
              </p>

              <div className="mt-6 space-y-6">
                <div className="rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] p-5">
                  <h3 className="text-lg font-semibold text-[#30486f]">Funzionalità gratuite</h3>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                    <li>pubblicazione di segnalazioni di smarrimento o ritrovamento, ove disponibile;</li>
                    <li>creazione dell’identità animale;</li>
                    <li>ricezione di comunicazioni o referti via email, secondo il servizio attivo;</li>
                    <li>accesso base ad alcune informazioni o funzionalità.</li>
                  </ul>
                </div>

                <div className="rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] p-5">
                  <h3 className="text-lg font-semibold text-[#30486f]">Funzionalità premium</h3>
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                    <li>accesso completo alla cartella clinica digitale;</li>
                    <li>timeline eventi e organizzazione avanzata dei dati;</li>
                    <li>promemoria sanitari;</li>
                    <li>notifiche avanzate;</li>
                    <li>ulteriori strumenti di gestione disponibili nel tempo.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Le funzionalità disponibili possono variare, essere modificate, integrate, sospese o
                rimosse nel tempo.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                16. Pagamenti, abbonamenti, rinnovi, cessazione e recesso
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Alcuni servizi o funzionalità premium possono essere soggetti a pagamento una
                tantum, abbonamento, prova gratuita o altre formule economiche.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente accetta che, ove applicabile:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  gli eventuali costi, la periodicità, l’IVA se applicabile e le condizioni
                  economiche siano indicati prima dell’attivazione del servizio;
                </li>
                <li>
                  la decorrenza del servizio premium sia quella comunicata in fase di attivazione o
                  acquisto;
                </li>
                <li>
                  gli eventuali rinnovi automatici, ove previsti, avvengano secondo le condizioni
                  rese note all’utente prima dell’adesione;
                </li>
                <li>
                  la disdetta debba essere effettuata con le modalità e nei tempi indicati nella
                  schermata di attivazione o nelle condizioni specifiche del servizio;
                </li>
                <li>
                  alla cessazione del servizio premium l’utente possa perdere l’accesso alle
                  funzionalità avanzate, restando salvi eventuali dati o contenuti conservati
                  secondo la normativa applicabile e le policy interne.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ove applicabile ai sensi di legge, l’utente consumatore potrà esercitare il diritto
                di recesso entro il termine previsto dalla normativa vigente. Qualora l’erogazione
                del contenuto o servizio digitale inizi prima della scadenza del termine di recesso,
                il consumatore prende atto che il diritto di recesso potrà essere escluso o limitato
                nei casi consentiti dalla legge, previa acquisizione dei consensi richiesti.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                17. Contenuti degli utenti, licenza d’uso, segnalazioni e rimozione
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Gli utenti sono i soli responsabili dei contenuti caricati, pubblicati, trasmessi o
                condivisi tramite la Piattaforma, inclusi testi, immagini, documenti, recapiti,
                recensioni, segnalazioni, informazioni sanitarie o descrittive e altri materiali.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente dichiara e garantisce che:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>
                  dispone dei diritti, dei consensi, dei titoli e delle autorizzazioni necessari
                  per pubblicare i contenuti;
                </li>
                <li>
                  i contenuti non violano diritti di terzi, inclusi diritti d’autore, immagine,
                  riservatezza, dati personali, segreti o altri diritti tutelati;
                </li>
                <li>
                  i contenuti sono leciti, non ingannevoli, non offensivi e non contrari all’ordine
                  pubblico o al buon costume;
                </li>
                <li>
                  la pubblicazione dei contenuti non espone UNIMALIA a responsabilità verso terzi.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Con il caricamento o la pubblicazione dei contenuti, l’utente concede a UNIMALIA una
                licenza non esclusiva, gratuita, revocabile nei limiti tecnicamente e giuridicamente
                compatibili con il funzionamento del servizio, valida per la durata necessaria
                all’erogazione della Piattaforma, per ospitare, archiviare, organizzare,
                visualizzare, trattare, riprodurre nei limiti tecnici necessari, comunicare
                all’utente interessato o ai soggetti da lui autorizzati e diffondere i contenuti
                all’interno delle funzionalità previste dal servizio.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">È vietato:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>inserire dati falsi, ingannevoli o non aggiornati;</li>
                <li>caricare contenuti illeciti, offensivi, diffamatori o lesivi di diritti di terzi;</li>
                <li>
                  utilizzare la Piattaforma per finalità abusive, fraudolente, concorrenza sleale o
                  scopi contrari alla legge;
                </li>
                <li>
                  tentare accessi non autorizzati, interferenze tecniche, scraping illecito o usi
                  impropri del sistema.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA si riserva il diritto di moderare, limitare, sospendere, oscurare o
                rimuovere contenuti illegali, segnalati, non conformi o ritenuti incompatibili con
                il corretto utilizzo della Piattaforma.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Chiunque ritenga che un contenuto sia illecito, inesatto o lesivo può segnalarlo a
                UNIMALIA tramite i canali indicati nella sezione Contatti, fornendo, ove possibile,
                gli elementi necessari all’identificazione del contenuto contestato e le ragioni
                della segnalazione. UNIMALIA si riserva di valutare tali segnalazioni e di adottare
                le misure ritenute appropriate nei limiti della normativa applicabile e delle
                informazioni disponibili.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                18. Manleva e indennizzo
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente si impegna a manlevare e tenere indenne UNIMALIA, i suoi amministratori,
                collaboratori, incaricati, fornitori e soggetti collegati da qualsiasi reclamo,
                contestazione, azione, domanda, danno, perdita, costo, onere, spesa o
                responsabilità, incluse ragionevoli spese legali, derivanti o connessi:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>ai contenuti caricati, pubblicati, trasmessi o diffusi dall’utente;</li>
                <li>all’uso illecito, improprio o non conforme della Piattaforma;</li>
                <li>alla violazione dei presenti Termini o di diritti di terzi;</li>
                <li>a dichiarazioni false, incomplete o fuorvianti rese dall’utente;</li>
                <li>
                  a contestazioni relative a rapporti, transazioni, servizi o interazioni
                  intervenute tra utenti o tra utente e professionista.
                </li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                19. Proprietà intellettuale della piattaforma
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Tutti i diritti di proprietà intellettuale e industriale relativi alla Piattaforma,
                inclusi, a titolo esemplificativo, software, codice, marchi, segni distintivi,
                loghi, layout, grafica, database, struttura del servizio, interfacce, testi di
                sistema e documentazione, appartengono a UNIMALIA o ai rispettivi titolari e sono
                protetti dalla normativa applicabile.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utilizzo della Piattaforma non comporta alcun trasferimento, licenza generale o
                cessione di diritti di proprietà intellettuale in favore dell’utente, salvo quanto
                strettamente necessario per l’uso personale e lecito dei servizi.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Restano fermi i diritti dell’utente sui contenuti da lui legittimamente caricati,
                fatti salvi i diritti e la licenza d’uso necessari al funzionamento della
                Piattaforma ai sensi dei presenti Termini.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                20. Limitazioni di responsabilità
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Nei limiti consentiti dalla legge, UNIMALIA non è responsabile per:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>interazioni, contatti, accordi, prestazioni o controversie tra utenti;</li>
                <li>servizi, prestazioni, omissioni, errori o condotte di professionisti o altri terzi;</li>
                <li>
                  decisioni sanitarie, cliniche, organizzative o patrimoniali adottate dagli utenti
                  o dai professionisti;
                </li>
                <li>contenuti pubblicati, caricati o trasmessi dagli utenti;</li>
                <li>errori, omissioni, ritardi, dati incompleti, non aggiornati o inesatti;</li>
                <li>
                  indisponibilità temporanee, malfunzionamenti, sospensioni, problemi di rete,
                  interruzioni o incompatibilità tecniche non imputabili a dolo o colpa grave di
                  UNIMALIA;
                </li>
                <li>
                  mancato ritrovamento di animali o esiti non soddisfacenti derivanti dall’uso dei
                  servizi.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Le limitazioni di responsabilità previste nel presente documento operano nei limiti
                massimi consentiti dalla normativa applicabile e non escludono la responsabilità nei
                casi in cui essa non possa essere validamente limitata o esclusa per legge.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Tutte le informazioni di natura sanitaria o clinica devono essere sempre verificate
                da un medico veterinario prima di qualsiasi decisione.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                21. Disponibilità del servizio, manutenzione, aggiornamenti e interruzioni
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA si impegna a mantenere la Piattaforma ragionevolmente accessibile, ma non
                garantisce la continuità assoluta del servizio, l’assenza di errori tecnici,
                l’accesso ininterrotto o la compatibilità con tutti i dispositivi, browser, sistemi
                operativi o configurazioni.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA potrà effettuare manutenzioni programmate o urgenti, aggiornamenti tecnici,
                modifiche di funzionalità, sospensioni temporanee per ragioni di sicurezza,
                stabilità, adeguamento normativo o miglioramento del servizio, senza che ciò
                attribuisca all’utente alcun diritto a indennizzi, salvo quanto inderogabilmente
                previsto dalla legge.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Salvo diversa previsione espressa, l’utente è tenuto a conservare autonomamente
                copia dei contenuti o documenti che ritenga rilevanti per i propri interessi e non
                può fare affidamento esclusivo sulla Piattaforma quale unico strumento di
                archiviazione personale o professionale.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                22. Sicurezza e accessi
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’utente è responsabile della custodia delle proprie credenziali, dell’utilizzo del
                proprio account e delle autorizzazioni eventualmente concesse ad altri soggetti
                attraverso le funzionalità della Piattaforma.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA non è responsabile per accessi non autorizzati derivanti da negligenza
                dell’utente, uso improprio delle credenziali, dispositivi compromessi, mancata
                adozione di adeguate misure di sicurezza o condotte imputabili a terzi non
                controllati da UNIMALIA.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                23. Reclami, assistenza e contestazioni
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Per reclami, richieste di assistenza, contestazioni o segnalazioni relative a
                contenuti, profili, accessi o funzionalità della Piattaforma, l’utente può
                contattare UNIMALIA ai recapiti indicati nella sezione Contatti.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA potrà richiedere informazioni integrative, chiarimenti, documenti o
                elementi identificativi utili a valutare la richiesta o la segnalazione.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Ove possibile, UNIMALIA gestirà le segnalazioni entro tempi ragionevoli, fermo
                restando che la natura tecnica, documentale o giuridica della richiesta potrà
                incidere sui tempi di lavorazione e sull’eventuale esito.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                24. Privacy, cookie e documenti collegati
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                I presenti Termini disciplinano il rapporto contrattuale e le condizioni di utilizzo
                della Piattaforma.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Il trattamento dei dati personali avviene secondo quanto previsto dalla Privacy
                Policy della piattaforma, consultabile nella sezione dedicata. L’eventuale utilizzo
                di cookie o strumenti analoghi è disciplinato dalla Cookie Policy e dagli eventuali
                strumenti di gestione del consenso messi a disposizione.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Per gli aspetti relativi alla protezione dei dati personali, l’utente deve fare
                riferimento alla documentazione privacy dedicata, che costituisce documento separato
                e complementare ai presenti Termini.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                25. Modifiche e aggiornamenti
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA si riserva il diritto di modificare, aggiornare o integrare in qualsiasi
                momento:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#55657d]">
                <li>le funzionalità della Piattaforma;</li>
                <li>le modalità di accesso o utilizzo del servizio;</li>
                <li>i presenti Termini e Condizioni;</li>
                <li>
                  le condizioni economiche dei servizi futuri, nel rispetto della normativa
                  applicabile.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Le modifiche avranno efficacia dalla data di pubblicazione sul sito, salvo diversa
                indicazione o diversa disciplina prevista dalla legge.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                26. Nullità parziale e sopravvivenza
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Qualora una o più disposizioni dei presenti Termini dovessero essere ritenute
                invalide, nulle, inefficaci o inapplicabili, tale invalidità, nullità o inefficacia
                non pregiudicherà la validità e l’efficacia delle restanti disposizioni, che
                continueranno a produrre pieno effetto nei limiti consentiti dalla legge.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                27. Legge applicabile e foro competente
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                I presenti Termini e Condizioni sono regolati dalla legge italiana.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Qualora l’utente rivesta la qualifica di consumatore ai sensi della normativa
                applicabile, per ogni controversia sarà competente il foro del luogo di residenza o
                domicilio del consumatore, ove previsto come inderogabile dalla legge.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Nei casi in cui ciò sia legittimamente consentito e l’utente non rivesta la
                qualifica di consumatore, il foro competente sarà quello del luogo in cui ha sede il
                titolare della Piattaforma, salvo diversa previsione inderogabile di legge.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                28. Versione linguistica prevalente
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                I presenti Termini sono redatti in lingua italiana. Qualora vengano rese disponibili
                versioni in altre lingue, la versione italiana prevarrà in caso di difformità
                interpretative, salvo diversa previsione inderogabile di legge.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">29. Contatti</h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Per informazioni, richieste, segnalazioni o reclami relativi alla Piattaforma:
              </p>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#30486f]">
                info@unimalia.it
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">30. Accettazione</h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                L’accesso, la navigazione e l’utilizzo della Piattaforma implicano l’accettazione
                dei presenti Termini e Condizioni di Utilizzo.
              </p>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-[#5f708a]">
                Ultimo aggiornamento: marzo 2026
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}