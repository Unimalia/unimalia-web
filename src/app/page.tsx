import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
  description:
    "UNIMALIA aiuta proprietari e professionisti a gestire identità animale, accessi clinici controllati, consulti, smarrimenti, segnalazioni di animali trovati e lieti fine in modo semplice e affidabile.",
  alternates: {
    canonical: "https://unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    url: "https://unimalia.it/",
    siteName: "UNIMALIA",
    images: ["/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    images: ["/logo-512.png"],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3"></div>
              <span className="text-xl font-bold text-gray-900">UNIMALIA</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600">Identità</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Smarrimenti</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Clinica</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Professionisti</a>
            </nav>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Accedi
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Identità digitale · Smarrimenti · Cartella clinica
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                La piattaforma digitale per proteggere l'animale in ogni momento che conta.
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                UNIMALIA unisce identità animale, strumenti territoriali, accessi clinici controllati e collaborazione con i professionisti in un ecosistema più chiaro, affidabile e immediato.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                  Crea identità animale
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
                  Segnala smarrimento
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
                  Segnala trovato
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-8 shadow-xl">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">UNIMALIA</p>
                      <h3 className="text-xl font-bold text-gray-900">Proteggi, ritrova, gestisci.</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-600 rounded-lg"></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-2">Identità animale digitale</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Un'unica base ordinata per QR code, dati principali, accessi controllati e strumenti pronti quando serve davvero.
                    </p>
                    <div className="flex gap-2 mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">QR code</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Accessi clinici</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">Smarrimenti</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-32 h-48 bg-gray-200 rounded-lg border-4 border-gray-800 relative">
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full"></div>
                        <div className="p-3">
                          <div className="bg-blue-600 text-white rounded-lg p-2 mb-2">
                            <p className="text-xs">SCHEDA ATTIVA</p>
                            <p className="text-sm font-bold">Luna</p>
                            <p className="text-xs">Golden Retriever</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="h-2 bg-gray-200 rounded mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded mb-1 w-3/4"></div>
                            <div className="h-2 bg-gray-200 rounded mb-2 w-1/2"></div>
                            <div className="bg-orange-100 rounded px-2 py-1 flex justify-between">
                              <span className="text-xs font-bold text-orange-800">QR</span>
                              <span className="text-xs text-orange-600">attivo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-blue-600">Smarrimenti</p>
                      <p className="text-xs text-gray-600">Segnalazioni più chiare</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-blue-600">Trovati</p>
                      <p className="text-xs text-gray-600">Avvistamenti ordinati</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-blue-600">Cartella</p>
                      <p className="text-xs text-gray-600">Continuità veterinari</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-200 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Un'unica base più chiara</h3>
              <p className="text-gray-600">
                Identità animale, dati essenziali e strumenti utili nello stesso ecosistema.
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supporto nei momenti delicati</h3>
              <p className="text-gray-600">
                Smarrimenti, trovati, avvistamenti e lieti fine in flussi più leggibili.
              </p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Continuità con i professionisti</h3>
              <p className="text-gray-600">
                Accessi controllati, consulti e collaborazione in modo più ordinato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto quello che serve, organizzato in aree più semplici da capire
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una homepage più chiara deve far capire subito cosa puoi fare e dove devi andare.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Identità digitale</h3>
              <p className="text-gray-600 mb-6">
                Una scheda animale moderna con dati essenziali, QR code e base informativa pronta da consultare e usare nel tempo.
              </p>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                Crea identità animale {'->'}
              </a>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-xl mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cartella clinica</h3>
              <p className="text-gray-600 mb-6">
                Una continuità migliore con i veterinari grazie ad accessi controllati, visibilità più chiara e collaborazione ordinata.
              </p>
              <a href="#" className="text-green-600 font-semibold hover:text-green-700">
                Apri area professionisti {'->'}
              </a>
            </div>
            <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-xl mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smarrimenti</h3>
              <p className="text-gray-600 mb-6">
                Segnala subito un animale smarrito in un flusso più chiaro, pensato per dare struttura e velocità al momento della ricerca.
              </p>
              <a href="#" className="text-orange-600 font-semibold hover:text-orange-700">
                Segnala smarrimento {'->'}
              </a>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Animali trovati e avvistati</h3>
              <p className="text-gray-600 mb-6">
                Raccogli segnalazioni utili sul territorio in modo più leggibile, con un sistema progettato per favorire il ricongiungimento.
              </p>
              <a href="#" className="text-yellow-600 font-semibold hover:text-yellow-700">
                Segnala trovato o avvistato {'->'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Perché nasce
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Quando le informazioni sono sparse, anche le azioni semplici diventano più difficili.
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                UNIMALIA nasce per ridurre dispersione, aumentare chiarezza e offrire una base più solida prima dell'emergenza, durante l'emergenza e dopo.
              </p>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-900">Dati essenziali più ordinati</span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-900">Strumenti rapidi quando serve agire</span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-900">Più chiarezza tra proprietari e professionisti</span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-900">Meno dispersione, più continuità</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
              <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Ecosistema UNIMALIA
              </div>
              <h3 className="text-3xl font-bold mb-6">
                Tutto più coerente, meno disperso.
              </h3>
              <p className="text-lg mb-8 text-blue-100">
                Identità animale, territorio, emergenza, accessi clinici e collaborazione con i professionisti non devono vivere in strumenti scollegati. Devono stare nello stesso sistema.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">Identità</p>
                  <p className="text-sm text-blue-100">Scheda animale, QR e dati principali.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">Territorio</p>
                  <p className="text-sm text-blue-100">Smarrimenti, trovati, avvistamenti e lieti fine.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <p className="font-semibold mb-2">Clinica</p>
                  <p className="text-sm text-blue-100">Accessi autorizzati e continuità con i veterinari.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-white font-semibold hover:text-blue-200">
                  Area professionisti {'->'}
                </a>
                <a href="#" className="text-blue-100 hover:text-white">
                  Prezzi
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Due grandi percorsi, ruoli più chiari
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La piattaforma funziona meglio quando ogni persona capisce subito il proprio spazio e le proprie responsabilità.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Veterinari</h3>
              <p className="text-gray-600 mb-6">
                Uno spazio più strutturato per lavorare con accessi autorizzati, consulti, cartella clinica e continuità operativa.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Richieste di accesso più chiare e tracciabili.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Lavoro ordinato sulla cartella clinica e sugli eventi.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Collaborazione migliore tra clinica, consulti e follow-up.</span>
                </li>
              </ul>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                Apri area veterinari {'->'}
              </a>
            </div>
            <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professionisti Pet</h3>
              <p className="text-gray-600 mb-6">
                Uno spazio dedicato per servizi non clinici, con ruoli distinti e una collaborazione più pulita con l'ecosistema UNIMALIA.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Percorsi separati dall'area clinica veterinaria.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Base pronta per toelettatori, pensioni, pet sitter e addestratori.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Più ordine e più continuità tra i diversi servizi intorno all'animale.</span>
                </li>
              </ul>
              <a href="#" className="text-orange-600 font-semibold hover:text-orange-700">
                Scopri i servizi {'->'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Prima costruisci una base chiara, poi reagisci meglio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              UNIMALIA deve essere utile prima dell'emergenza, durante l'emergenza e anche dopo.
            </p>
          </div>
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Crea la scheda</h3>
              <p className="text-gray-600">
                Inserisci i dati principali dell'animale e genera la sua identità digitale.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Attiva strumenti</h3>
              <p className="text-gray-600">
                Usa QR, dati essenziali e accessi controllati per preparare una base solida.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestisci segnalazioni</h3>
              <p className="text-gray-600">
                In caso di smarrimento, ritrovamento o avvistamento hai già una struttura pronta.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mantieni continuità</h3>
              <p className="text-gray-600">
                Quando tutto si risolve, le informazioni restano più ordinate e utili nel tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-3xl p-12 border border-gray-200">
            <div className="grid lg:grid-cols-2 gap-12 items-end">
              <div>
                <div className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  Chiusura
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  UNIMALIA rende più semplice proteggere l'animale nel momento in cui conta davvero.
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali trovati, avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia.
                </p>
              </div>
              <div className="space-y-4">
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                  Crea identità animale
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
                  Segnala smarrimento
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
                  Segnala trovato o avvistato
                </button>
                <a href="#" className="block text-center text-gray-600 hover:text-gray-900 pt-2">
                  Prezzi
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3"></div>
                <span className="text-xl font-bold">UNIMALIA</span>
              </div>
              <p className="text-gray-400">
                La piattaforma digitale per proteggere l'animale in ogni momento che conta.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotti</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Identità digitale</a></li>
                <li><a href="#" className="hover:text-white">Smarrimenti</a></li>
                <li><a href="#" className="hover:text-white">Cartella clinica</a></li>
                <li><a href="#" className="hover:text-white">Professionisti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Chi siamo</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Lavora con noi</a></li>
                <li><a href="#" className="hover:text-white">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legale</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Termini</a></li>
                <li><a href="#" className="hover:text-white">Cookie</a></li>
                <li><a href="#" className="hover:text-white">Licenze</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 UNIMALIA. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}