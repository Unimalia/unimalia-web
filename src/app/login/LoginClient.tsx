"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  full_name: string | null;
  fiscal_code: string | null;
  city: string | null;
  phone: string | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
};

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function normalizePhone(s: string) {
  return (s || "").replace(/\s+/g, "").trim();
}

function isLikelyFullName(s: string) {
  const v = (s || "").trim();
  if (v.length < 5) return false;
  const parts = v.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

function isProfileComplete(p: ProfileRow | null) {
  if (!p) return false;

  const fullNameOk = isLikelyFullName(p.full_name ?? "");
  const cityOk = (p.city ?? "").trim().length >= 2;
  const phoneOk = normalizePhone(p.phone ?? "").length >= 6;

  const cf = normalizeCF(p.fiscal_code ?? "");
  const cfOk = !cf || cf.length === 16;

  return fullNameOk && cityOk && phoneOk && cfOk;
}

function sanitizeNextPath(value: string | null) {
  if (!value) return "/identita";
  if (!value.startsWith("/")) return "/identita";
  if (value.startsWith("//")) return "/identita";
  return value;
}

function getPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < 12) issues.push("almeno 12 caratteri");
  if (!/[a-z]/.test(password)) issues.push("almeno una lettera minuscola");
  if (!/[A-Z]/.test(password)) issues.push("almeno una lettera maiuscola");
  if (!/[0-9]/.test(password)) issues.push("almeno un numero");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("almeno un simbolo");

  return issues;
}

async function ensureProfileRow(userId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata ?? {};

  await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: typeof metadata.full_name === "string" ? metadata.full_name.trim() || null : null,
      city: typeof metadata.city === "string" ? metadata.city.trim() || null : null,
      fiscal_code:
        typeof metadata.fiscal_code === "string" ? normalizeCF(metadata.fiscal_code) || null : null,
      phone: typeof metadata.phone === "string" ? normalizePhone(metadata.phone) || null : null,
    },
    { onConflict: "id" }
  );
}

async function decideRedirect(
  router: ReturnType<typeof useRouter>,
  fallback: string,
  setMsg?: (value: string | null) => void
) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  await ensureProfileRow(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,fiscal_code,city,phone,is_archived,is_deleted")
    .eq("id", user.id)
    .single();

  const row = (profile ?? null) as ProfileRow | null;

  if (row?.is_deleted) {
    await supabase.auth.signOut();
    setMsg?.("Questo account è stato eliminato definitivamente e non può più essere utilizzato.");
    router.replace("/login?account=eliminato");
    return;
  }

  if (row?.is_archived) {
    await supabase.auth.signOut();
    setMsg?.("Questo account è attualmente disattivato.");
    router.replace("/login?account=disattivato");
    return;
  }

  if (!isProfileComplete(row)) {
    router.replace(`/profilo?returnTo=${encodeURIComponent(fallback)}`);
  } else {
    router.replace(fallback);
  }
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-[#30486f]">
      {children}
    </label>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-2 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
    />
  );
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = sanitizeNextPath(searchParams.get("next"));
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const emailFromUrl = (searchParams.get("email") || "").trim().toLowerCase();
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail((prev) => (prev ? prev : emailFromUrl));
    }
  }, [emailFromUrl]);

  useEffect(() => {
    const accountState = searchParams.get("account");

    if (accountState === "disattivato") {
      setMsg("Il tuo account è stato disattivato correttamente.");
    } else if (accountState === "eliminato") {
      setMsg("Il tuo account è stato eliminato definitivamente.");
    }
  }, [searchParams]);

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (data.user) {
        await decideRedirect(router, next, setMsg);
        return;
      }

      setLoadingPage(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        await decideRedirect(router, next, setMsg);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setMsg("Inserisci email.");
      return;
    }

    if (mode === "login") {
      if (!password) {
        setMsg("Inserisci la password.");
        return;
      }
    }

    if (mode === "signup") {
      if (!isLikelyFullName(fullName)) {
        setMsg("Inserisci nome e cognome reali.");
        return;
      }

      if ((city || "").trim().length < 2) {
        setMsg("Inserisci la città.");
        return;
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        setMsg("Inserisci il numero di telefono.");
        return;
      }

      if (normalizedPhone.length < 6) {
        setMsg("Inserisci un numero di telefono valido.");
        return;
      }

      const cf = normalizeCF(fiscalCode);
      if (cf && cf.length !== 16) {
        setMsg("Il codice fiscale deve avere 16 caratteri oppure va lasciato vuoto.");
        return;
      }

      if (passwordIssues.length > 0) {
        setMsg(`Password non valida: ${passwordIssues.join(", ")}.`);
        return;
      }

      if (password !== confirmPassword) {
        setMsg("Le due password non coincidono.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const cf = normalizeCF(fiscalCode);
        const normalizedPhone = normalizePhone(phone);

        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password,
          options: {
            emailRedirectTo: "https://unimalia.it/auth/confirm",
            data: {
              full_name: fullName.trim(),
              city: city.trim(),
              phone: normalizedPhone,
              fiscal_code: cf || null,
            },
          },
        });

        if (error) {
          const m = (error.message || "").toLowerCase();

          if (
            m.includes("already registered") ||
            m.includes("already exists") ||
            m.includes("user already registered")
          ) {
            setMsg(
              "Questa email risulta già registrata. Usa “Accedi” oppure “Password dimenticata”."
            );
            setMode("login");
            return;
          }

          setMsg(error.message);
          return;
        }

        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          setMsg(
            "Registrazione quasi completata ✅ Controlla la tua email e clicca il link di conferma. Ti riporteremo su UNIMALIA per completare l’accesso."
          );
          setMode("login");
          return;
        }

        await ensureProfileRow(data.user.id);
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            full_name: fullName.trim(),
            city: city.trim(),
            phone: normalizedPhone,
            fiscal_code: cf || null,
          },
          { onConflict: "id" }
        );

        await decideRedirect(router, next, setMsg);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("confirm") || m.includes("confirmed") || m.includes("not confirmed")) {
          setMsg(
            "Email non confermata. Controlla la tua casella di posta e clicca il link di conferma."
          );
          return;
        }

        setMsg("Credenziali non valide. Controlla email e password.");
        return;
      }

      await decideRedirect(router, next, setMsg);
    } catch (err: unknown) {
      console.error("LOGIN ERROR:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : navigator.onLine
              ? "Errore di rete (fetch). Controlla URL Supabase / AdBlock."
              : "Sei offline. Controlla internet.";
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setMsg(null);

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setMsg("Scrivi prima la tua email, poi clicca “Password dimenticata”.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: "https://unimalia.it/login",
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Ok ✅ Se l’email è corretta, riceverai un link per reimpostare la password.");
    } catch (err: unknown) {
      console.error("RESET ERROR:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : navigator.onLine
              ? "Errore di rete (fetch)."
              : "Sei offline. Controlla internet.";
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
              Accesso UNIMALIA
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
              Caricamento…
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#55657d]">
              Stiamo preparando l’accesso al tuo spazio UNIMALIA.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Accesso owner
              </div>

              <Link
                href="/"
                className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
              >
                ← Torna alla home
              </Link>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
              {mode === "login" ? "Accedi a UNIMALIA" : "Crea il tuo account"}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-[#55657d] sm:text-base">
              Gli smarrimenti su UNIMALIA sono sempre gratuiti e possono essere pubblicati anche
              senza registrazione. Creare un account ti permette di gestire identità animale,
              documenti, continuità e funzioni più complete della piattaforma.
            </p>

            <div className="mt-6 rounded-[24px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#30486f]">Sei un professionista?</p>
              <p className="mt-2 text-sm leading-7 text-[#55657d]">
                Per veterinari, cliniche e altri professionisti è disponibile un accesso dedicato,
                separato dal percorso owner.
              </p>
              <Link
                href="/professionisti/login"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Vai al Portale Professionisti
              </Link>
            </div>

            <div className="mt-8 rounded-[28px] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-6">
              <div className="mb-6 inline-flex rounded-full border border-[#dbe5ef] bg-[#f5f9fd] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-[#30486f] text-white shadow-[0_10px_24px_rgba(48,72,111,0.18)]"
                      : "text-[#5f708a] hover:text-[#30486f]"
                  }`}
                >
                  Accedi
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-[#30486f] text-white shadow-[0_10px_24px_rgba(48,72,111,0.18)]"
                      : "text-[#5f708a] hover:text-[#30486f]"
                  }`}
                >
                  Registrati
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
                {mode === "signup" && (
                  <>
                    <div>
                      <FieldLabel htmlFor="full-name">Nome e cognome</FieldLabel>
                      <FieldInput
                        id="full-name"
                        name="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Es. Mario Rossi"
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="city">Città</FieldLabel>
                      <FieldInput
                        id="city"
                        name="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Es. Firenze"
                        autoComplete="address-level2"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="phone">Telefono</FieldLabel>
                      <FieldInput
                        id="phone"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Es. +39 333 1234567"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="fiscal-code">
                        Codice fiscale <span className="font-medium text-[#7a8799]">(facoltativo)</span>
                      </FieldLabel>
                      <FieldInput
                        id="fiscal-code"
                        name="fiscal-code"
                        value={fiscalCode}
                        onChange={(e) => setFiscalCode(e.target.value)}
                        placeholder="16 caratteri"
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}

                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <FieldInput
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tuo@email.it"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="email"
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldInput
                    id="password"
                    name={mode === "signup" ? "new-password" : "password"}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Minimo 12 caratteri" : "La tua password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={mode === "signup" ? 12 : undefined}
                    required
                  />
                  {mode === "signup" && (
                    <p className="mt-2 text-xs leading-6 text-[#5f708a]">
                      Usa almeno 12 caratteri con maiuscola, minuscola, numero e simbolo. Il browser
                      o il telefono possono proporti una password casuale sicura.
                    </p>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <FieldLabel htmlFor="confirm-password">Conferma password</FieldLabel>
                    <FieldInput
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti la password"
                      autoComplete="new-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      minLength={12}
                      required
                    />
                  </div>
                )}

                {mode === "signup" && password.length > 0 && (
                  <div className="rounded-[22px] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#55657d]">
                    <p className="font-semibold text-[#30486f]">Requisiti password</p>
                    <ul className="mt-3 space-y-2 leading-6">
                      <li>{password.length >= 12 ? "✓" : "•"} Almeno 12 caratteri</li>
                      <li>{/[a-z]/.test(password) ? "✓" : "•"} Almeno una minuscola</li>
                      <li>{/[A-Z]/.test(password) ? "✓" : "•"} Almeno una maiuscola</li>
                      <li>{/[0-9]/.test(password) ? "✓" : "•"} Almeno un numero</li>
                      <li>{/[^A-Za-z0-9]/.test(password) ? "✓" : "•"} Almeno un simbolo</li>
                    </ul>
                  </div>
                )}

                {msg && (
                  <div className="rounded-[22px] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm leading-7 text-[#30486f]">
                    {msg}
                  </div>
                )}

                <button
                  disabled={submitting}
                  className="w-full rounded-full bg-[#30486f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                  type="submit"
                >
                  {submitting ? "Attendi..." : mode === "login" ? "Accedi" : "Crea account"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full rounded-full border border-[#d7e0ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff] disabled:opacity-60"
                    disabled={submitting}
                  >
                    Password dimenticata
                  </button>
                )}
              </form>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#d7e0ea] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Perché creare un account
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tutto più ordinato, più accessibile, più utile
            </h2>

            <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
              Con un account UNIMALIA puoi accedere alla parte più completa dell’esperienza owner e
              gestire meglio le informazioni del tuo animale nel tempo.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                <h3 className="text-lg font-semibold">Identità animale digitale</h3>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  Un punto di accesso semplice e sempre disponibile per raccogliere le informazioni
                  più importanti del tuo animale.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                <h3 className="text-lg font-semibold">Più continuità nel tempo</h3>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  Referti, documenti e contenuti ricevuti diventano più facili da ritrovare e da
                  consultare quando servono davvero.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                <h3 className="text-lg font-semibold">Accesso alle funzioni evolute</h3>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  L’account è il punto di ingresso per le funzionalità più complete di UNIMALIA e
                  per le evoluzioni future dedicate agli owner.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/12 bg-white/10 p-5">
              <p className="text-sm font-semibold text-white">Smarrimenti sempre gratuiti</p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                Anche senza account puoi pubblicare uno smarrimento. La registrazione serve per
                entrare nella parte più completa della piattaforma e gestire meglio l’identità del
                tuo animale.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/prezzi"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f4f7fb]"
              >
                Scopri i piani owner
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}