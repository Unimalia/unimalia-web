"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileStateRow = {
  is_archived: boolean | null;
  is_deleted: boolean | null;
};

type ProfessionalStateRow = {
  id: string;
  approved: boolean | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
  is_vet: boolean | null;
  verification_status?: string | null;
  verification_level?: string | null;
  public_visible?: boolean | null;
};

function safeNextPath(next: string | null | undefined) {
  const n = String(next || "").trim();

  if (!n) return "/professionisti/dashboard";
  if (!n.startsWith("/professionisti")) return "/professionisti/dashboard";
  if (n.startsWith("/professionisti/login")) return "/professionisti/dashboard";

  return n;
}

function normalizePhone(input: string) {
  return String(input || "").replace(/\s+/g, "").trim();
}

function getPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < 12) issues.push("almeno 12 caratteri");
  if (!/[a-z]/.test(password)) issues.push("almeno una minuscola");
  if (!/[A-Z]/.test(password)) issues.push("almeno una maiuscola");
  if (!/[0-9]/.test(password)) issues.push("almeno un numero");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("almeno un simbolo");

  return issues;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Errore inatteso.";
}

function isProfessionalEnabled(
  user:
    | {
        app_metadata?: Record<string, unknown> | null;
        user_metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined
) {
  if (!user) return false;

  return Boolean(
    user.app_metadata?.is_professional === true ||
      user.user_metadata?.is_professional === true
  );
}

function isVetUser(
  user:
    | {
        email?: string | null;
        app_metadata?: Record<string, unknown> | null;
        user_metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined
) {
  if (!user) return false;

  const email = String(user.email || "").toLowerCase().trim();
  if (email === "valentinotwister@hotmail.it") return true;

  return Boolean(
    user.app_metadata?.is_vet === true ||
      user.user_metadata?.is_vet === true ||
      user.app_metadata?.professional_type === "veterinarian" ||
      user.user_metadata?.professional_type === "veterinarian" ||
      user.user_metadata?.is_veterinarian === true
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "blue" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[#d7dfe9] bg-[#f8fbff] text-[#4f6078]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNextPath(sp.get("next"));
  const initialMode = sp.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [professionalType, setProfessionalType] = useState<"generic" | "veterinarian">("generic");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);

  const canSubmit = useMemo(() => {
    if (mode === "login") {
      return email.trim().length > 3 && password.length >= 1;
    }

    return (
      email.trim().length > 3 &&
      normalizePhone(phone).length >= 6 &&
      password.length >= 12 &&
      confirmPassword.length >= 12
    );
  }, [email, phone, password, confirmPassword, mode]);

  const handleProfessionalPostLoginRedirect = useCallback(
    async (userId: string) => {
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("is_archived, is_deleted")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) {
        setErr("Errore nel recupero del profilo.");
        return;
      }

      const profile = (profileData ?? null) as ProfileStateRow | null;

      if (profile?.is_deleted) {
        await supabase.auth.signOut();
        setErr("Questo account è stato eliminato definitivamente.");
        return;
      }

      if (profile?.is_archived) {
        await supabase.auth.signOut();
        setErr("Questo account è attualmente disattivato.");
        return;
      }

      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select(
          "id, approved, is_archived, is_deleted, is_vet, verification_status, verification_level, public_visible"
        )
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (proErr) {
        setErr("Errore nel recupero del profilo professionista.");
        return;
      }

      const professional = (proData?.[0] ?? null) as ProfessionalStateRow | null;

      if (!professional) {
        router.replace("/professionisti/nuovo");
        return;
      }

      if (professional.is_deleted) {
        await supabase.auth.signOut();
        setErr("Il profilo professionista collegato a questo account è stato eliminato.");
        return;
      }

      if (professional.is_archived) {
        await supabase.auth.signOut();
        setErr("Il profilo professionista collegato a questo account è disattivato.");
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!isProfessionalEnabled(user)) {
        await supabase.auth.signOut();
        setErr("Questo account non è abilitato al Portale Professionisti.");
        return;
      }

      const userIsVet = isVetUser(user);
      const professionalIsVet = professional.is_vet === true;
      const mustWaitSuperadminApproval = userIsVet || professionalIsVet;

      if (mustWaitSuperadminApproval && professional.approved !== true) {
        router.replace("/professionisti/nuovo/modifica?pending=1");
        return;
      }

      router.replace(next);
    },
    [next, router]
  );

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (user) {
        await handleProfessionalPostLoginRedirect(user.id);
        return;
      }

      setLoadingPage(false);
    }

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        await handleProfessionalPostLoginRedirect(session.user.id);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [handleProfessionalPostLoginRedirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone) {
          setErr("Il numero di telefono è obbligatorio.");
          setLoading(false);
          return;
        }

        if (normalizedPhone.length < 6) {
          setErr("Inserisci un numero di telefono valido.");
          setLoading(false);
          return;
        }

        if (passwordIssues.length > 0) {
          setErr(`Password non valida: ${passwordIssues.join(", ")}.`);
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErr("Le due password non coincidono.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: "https://unimalia.it/auth/confirm?next=%2Fprofessionisti%2Flogin",
            data: {
              is_professional: true,
              professional_type: professionalType,
              is_veterinarian: professionalType === "veterinarian",
              phone: normalizedPhone,
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
            setErr(
              "Questa email risulta già registrata. Usa “Accedi” oppure “Password dimenticata”."
            );
            setMode("login");
            setLoading(false);
            return;
          }

          setErr(error.message || "Errore registrazione.");
          setLoading(false);
          return;
        }

        setLoading(false);
        setMsg(
          professionalType === "veterinarian"
            ? "Registrazione veterinario completata ✅ Controlla l’email per confermare l’account. Dopo la conferma potrai creare la scheda professionista, che resterà in attesa di revisione superadmin."
            : "Registrazione professionista completata ✅ Controlla l’email per confermare l’account. Dopo la conferma potrai creare la scheda professionista."
        );
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();

        if (m.includes("confirm") || m.includes("confirmed") || m.includes("not confirmed")) {
          setErr(
            "Email non confermata. Controlla la tua casella di posta e clicca il link di conferma."
          );
          setLoading(false);
          return;
        }

        setErr(error.message || "Errore login.");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setErr("Sessione non trovata dopo il login.");
        setLoading(false);
        return;
      }

      await handleProfessionalPostLoginRedirect(user.id);
      setLoading(false);
    } catch (e: unknown) {
      setLoading(false);
      setErr(getErrorMessage(e));
    }
  }

  async function handleResetPassword() {
    setErr(null);
    setMsg(null);

    const e1 = email.trim().toLowerCase();
    if (!e1) {
      setErr("Scrivi prima la tua email.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e1, {
        redirectTo: "https://unimalia.it/professionisti/login",
      });

      if (error) {
        setErr(error.message || "Errore invio reset password.");
        setLoading(false);
        return;
      }

      setMsg("Se l’email esiste, riceverai un link per reimpostare la password.");
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-zinc-900">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
            <p className="text-sm text-[#5f708a]">Caricamento…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-[#5f708a] hover:text-[#30486f]">
            ← Sito pubblico
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <section className="rounded-[2.5rem] border border-[#dde4ec] bg-white p-8 shadow-[0_24px_60px_rgba(42,56,86,0.10)] sm:p-10">
            <Badge>Rete UNIMALIA</Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#30486f] sm:text-5xl">
              Portale Professionisti
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#5f708a]">
              Piattaforma in cloud per professionisti del settore animale, progettata per gestire
              animali, dati e collaborazioni in modo semplice, serio e sicuro.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                Prima di registrarti
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                Scopri come funziona UNIMALIA per il tuo profilo professionale
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
                Scegli il percorso più adatto e capisci subito quali vantaggi puoi ottenere dalla
                piattaforma.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/rete/veterinari"
                  className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
                >
                  Scopri area veterinari
                </Link>

                <Link
                  href="/rete/professionisti"
                  className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                >
                  Scopri area professionisti
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
                <p className="text-sm font-semibold text-[#30486f]">Veterinari</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                  Cartella sanitaria digitale, referti, consulti tra colleghi e gestione più
                  ordinata dei pazienti.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
                <p className="text-sm font-semibold text-[#30486f]">Altri professionisti</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                  Uno spazio in evoluzione per servizi e attività del settore animale, con
                  strumenti dedicati in crescita.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.05)] sm:col-span-2 xl:col-span-1">
                <p className="text-sm font-semibold text-[#30486f]">In evoluzione</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                  La piattaforma è progettata per integrare nel tempo funzioni sempre più
                  complete, incluse future prenotazioni online.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-[#dde4ec] bg-white p-8 shadow-[0_24px_60px_rgba(42,56,86,0.10)] sm:p-10">
            <div className="flex gap-2 rounded-2xl bg-[#f4f7fb] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErr(null);
                  setMsg(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-[#30486f] text-white shadow-sm"
                    : "text-[#5f708a] hover:bg-white hover:text-[#30486f]"
                }`}
              >
                Accedi
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErr(null);
                  setMsg(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-[#30486f] text-white shadow-sm"
                    : "text-[#5f708a] hover:bg-white hover:text-[#30486f]"
                }`}
              >
                Registrati
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="on">
              {mode === "signup" && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55657d]">
                    Tipo di registrazione
                  </label>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setProfessionalType("generic")}
                      className={`rounded-[1.4rem] border px-4 py-4 text-left text-sm font-semibold transition ${
                        professionalType === "generic"
                          ? "border-[#30486f] bg-[#30486f] text-white"
                          : "border-[#e3e9f0] bg-white text-[#30486f] hover:bg-[#f8fbff]"
                      }`}
                    >
                      Professionista
                      <div className="mt-1 text-xs font-normal opacity-90">
                        Toelettatura, pensione, educatore, pet sitter, altri servizi.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfessionalType("veterinarian")}
                      className={`rounded-[1.4rem] border px-4 py-4 text-left text-sm font-semibold transition ${
                        professionalType === "veterinarian"
                          ? "border-[#30486f] bg-[#30486f] text-white"
                          : "border-[#e3e9f0] bg-white text-[#30486f] hover:bg-[#f8fbff]"
                      }`}
                    >
                      Veterinario
                      <div className="mt-1 text-xs font-normal opacity-90">
                        Accesso veterinario con verifica e abilitazioni dedicate.
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="pro-email" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55657d]">
                  Email
                </label>
                <input
                  id="pro-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  type="email"
                  inputMode="email"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label htmlFor="pro-phone" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55657d]">
                    Telefono
                  </label>
                  <input
                    id="pro-phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 h-12 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                    autoComplete="tel"
                    autoCapitalize="none"
                    spellCheck={false}
                    type="tel"
                    inputMode="tel"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="pro-password" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55657d]">
                  Password
                </label>
                <input
                  id="pro-password"
                  name={mode === "login" ? "password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="mt-1 h-12 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  autoCapitalize="none"
                  spellCheck={false}
                  minLength={mode === "signup" ? 12 : undefined}
                />
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label
                      htmlFor="pro-confirm-password"
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55657d]"
                    >
                      Conferma password
                    </label>
                    <input
                      id="pro-confirm-password"
                      name="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      className="mt-1 h-12 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                      autoComplete="new-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      minLength={12}
                    />
                  </div>

                  {password.length > 0 && (
                    <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#30486f]">
                      <p className="font-semibold">Requisiti password</p>
                      <ul className="mt-2 space-y-1 text-[#5f708a]">
                        <li>{password.length >= 12 ? "✅" : "•"} Almeno 12 caratteri</li>
                        <li>{/[a-z]/.test(password) ? "✅" : "•"} Almeno una minuscola</li>
                        <li>{/[A-Z]/.test(password) ? "✅" : "•"} Almeno una maiuscola</li>
                        <li>{/[0-9]/.test(password) ? "✅" : "•"} Almeno un numero</li>
                        <li>{/[^A-Za-z0-9]/.test(password) ? "✅" : "•"} Almeno un simbolo</li>
                      </ul>
                    </div>
                  )}
                </>
              )}

              {err ? (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                  {err}
                </div>
              ) : null}

              {msg ? (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  {msg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01] disabled:opacity-50"
              >
                {loading
                  ? mode === "login"
                    ? "Accesso…"
                    : "Registrazione…"
                  : mode === "login"
                    ? "Accedi"
                    : professionalType === "veterinarian"
                      ? "Registrati come veterinario"
                      : "Registrati come professionista"}
              </button>

              {mode === "login" ? (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#d7dfe9] bg-white px-5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff] disabled:opacity-50"
                >
                  Password dimenticata
                </button>
              ) : null}

              <div className="text-xs text-[#6f7d91]">
                Dopo l’accesso verrai reindirizzato a:{" "}
                <span className="font-semibold text-[#30486f]">{next}</span>
              </div>
            </form>

            <div className="mt-6 border-t border-[#e9eef4] pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">Cloud</Badge>
                <Badge>Controllo accessi</Badge>
                <Badge tone="emerald">Rete professionale</Badge>
                <Badge tone="amber">In evoluzione</Badge>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}