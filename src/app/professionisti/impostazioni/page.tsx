"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { authHeaders } from "@/lib/client/authHeaders";
import {
  createClinicOperatorClient,
  listClinicOperatorsClient,
  type ClinicOperatorItem,
} from "@/lib/client/clinicOperators";
import {
  activateOperatorSession,
  changePinFirstAccess,
  getOperatorSessionCurrent,
  heartbeatOperatorSession,
  logoutOperatorSession,
  switchOperatorSession,
  type OperatorSession,
} from "@/lib/client/operatorSession";

type Professional = {
  id: string;
  owner_id: string | null;
  display_name: string;
  category: string;
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

type ProfessionalType = "generic" | "veterinarian";

type VetinfoStatus = "not_configured" | "not_connected" | "connected" | "reauth_required";

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "pet_detective", label: "Pet Detective" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

type LocalPrefs = {
  defaultView: "dashboard" | "animali" | "scansiona";
  compactMode: boolean;
  internalNotesEnabled: boolean;
  notifyAccessRequests: boolean;
  notifyConsults: boolean;
  notifyClinicalUpdates: boolean;
};

const DEFAULT_PREFS: LocalPrefs = {
  defaultView: "dashboard",
  compactMode: false,
  internalNotesEnabled: true,
  notifyAccessRequests: true,
  notifyConsults: true,
  notifyClinicalUpdates: true,
};

const WORKSTATION_STORAGE_KEY = "unimalia:clinic-workstation-key";

function isEmailValid(email: string) {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function normalizeProvince(value: string) {
  return value.trim().toUpperCase();
}

function prefsStorageKey(userId: string) {
  return `unimalia:pro-settings:${userId}`;
}

function getProfessionalTypeFromUser(user: {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const raw =
    user?.app_metadata?.professional_type ?? user?.user_metadata?.professional_type ?? "generic";

  return raw === "veterinarian" ? "veterinarian" : "generic";
}

function getAllowedMacroByProfessionalType(professionalType: ProfessionalType) {
  if (professionalType === "veterinarian") {
    return MACRO;
  }

  return MACRO.filter((item) => item.key !== "veterinari");
}

function vetinfoStatusLabel(status: VetinfoStatus) {
  switch (status) {
    case "connected":
      return "Collegato";
    case "reauth_required":
      return "Ricollegare";
    case "not_connected":
      return "Non collegato";
    case "not_configured":
    default:
      return "Non configurato";
  }
}

function operatorStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Bozza";
    case "pending_director_approval":
      return "In attesa";
    case "active":
      return "Attivo";
    case "suspended":
      return "Sospeso";
    case "revoked":
      return "Revocato";
    default:
      return status;
  }
}

function getOrCreateWorkstationKey() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(WORKSTATION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = `ws_${crypto.randomUUID().toLowerCase()}`;
  window.localStorage.setItem(WORKSTATION_STORAGE_KEY, generated);
  return generated;
}

export default function ProfessionistiImpostazioniPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingVetinfo, setLoadingVetinfo] = useState(false);
  const [connectingVetinfo, setConnectingVetinfo] = useState(false);

  const [loadingOperators, setLoadingOperators] = useState(false);
  const [savingOperator, setSavingOperator] = useState(false);

  const [loadingOperatorSession, setLoadingOperatorSession] = useState(false);
  const [savingOperatorSession, setSavingOperatorSession] = useState(false);
  const [savingFirstAccessPinChange, setSavingFirstAccessPinChange] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("generic");

  const [pro, setPro] = useState<Professional | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("altro");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");

  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_PREFS);

  const [vetinfoConfigured, setVetinfoConfigured] = useState(false);
  const [vetinfoStatus, setVetinfoStatus] = useState<VetinfoStatus>("not_configured");

  const [operators, setOperators] = useState<ClinicOperatorItem[]>([]);
  const [actorOperator, setActorOperator] = useState<ClinicOperatorItem | null>(null);

  const [workstationKey, setWorkstationKey] = useState("");
  const [currentOperatorSession, setCurrentOperatorSession] = useState<OperatorSession | null>(null);
  const [selectedSessionOperatorId, setSelectedSessionOperatorId] = useState("");
  const [sessionPin, setSessionPin] = useState("");

  const [firstAccessPinChangeRequired, setFirstAccessPinChangeRequired] = useState(false);
  const [firstAccessOperatorLabel, setFirstAccessOperatorLabel] = useState("");
  const [firstAccessCurrentPin, setFirstAccessCurrentPin] = useState("");
  const [firstAccessNewPin, setFirstAccessNewPin] = useState("");
  const [firstAccessConfirmPin, setFirstAccessConfirmPin] = useState("");

  const [opFirstName, setOpFirstName] = useState("");
  const [opLastName, setOpLastName] = useState("");
  const [opDisplayName, setOpDisplayName] = useState("");
  const [opRole, setOpRole] = useState("");
  const [opIsVeterinarian, setOpIsVeterinarian] = useState(true);
  const [opIsPrescriber, setOpIsPrescriber] = useState(true);
  const [opFnoviNumber, setOpFnoviNumber] = useState("");
  const [opFnoviProvince, setOpFnoviProvince] = useState("");
  const [opTaxCode, setOpTaxCode] = useState("");
  const [opEmail, setOpEmail] = useState("");
  const [opPhone, setOpPhone] = useState("");
  const [opInitialPin, setOpInitialPin] = useState("");
  const [opCanUseRev, setOpCanUseRev] = useState(false);
  const [opApprovalNotes, setOpApprovalNotes] = useState("");

  const allowedMacro = useMemo(
    () => getAllowedMacroByProfessionalType(professionalType),
    [professionalType]
  );

  const canManageOperators = Boolean(
    actorOperator?.isMedicalDirector || actorOperator?.canManageOperators
  );

  async function loadOperators() {
    setLoadingOperators(true);
    try {
      const result = await listClinicOperatorsClient();
      setOperators(result.operators ?? []);
      setActorOperator(result.actor ?? null);
    } catch {
      setOperators([]);
      setActorOperator(null);
    } finally {
      setLoadingOperators(false);
    }
  }

  async function refreshOperatorSession(workstationKeyValue?: string) {
    const resolvedWorkstationKey =
      workstationKeyValue || workstationKey || getOrCreateWorkstationKey();

    if (!resolvedWorkstationKey) {
      return;
    }

    setLoadingOperatorSession(true);

    try {
      const result = await getOperatorSessionCurrent(resolvedWorkstationKey);
      setWorkstationKey(result.workstationKey);
      setCurrentOperatorSession(result.session);

      if (result.session?.activeClinicOperatorId) {
        setSelectedSessionOperatorId(result.session.activeClinicOperatorId);
      } else if (result.currentUserClinicOperatorId) {
        setSelectedSessionOperatorId(result.currentUserClinicOperatorId);
      } else if (result.availableOperators?.length) {
        setSelectedSessionOperatorId(
          (prev) => prev || result.availableOperators[0].clinicOperatorId
        );
      }
    } catch {
      setCurrentOperatorSession(null);
    } finally {
      setLoadingOperatorSession(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/professionisti/login");
        return;
      }

      if (!alive) return;

      const resolvedProfessionalType = getProfessionalTypeFromUser(user);

      setUserId(user.id);
      setUserEmail(user.email ?? "");
      setProfessionalType(resolvedProfessionalType);

      const initialWorkstationKey = getOrCreateWorkstationKey();
      setWorkstationKey(initialWorkstationKey);

      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select(
          "id,owner_id,display_name,category,city,province,address,phone,email,website,description"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (proErr || !proData || proData.length === 0) {
        setError("Scheda professionista non trovata.");
        setLoading(false);
        return;
      }

      const p = proData[0] as Professional;

      setPro(p);
      setDisplayName(p.display_name ?? "");
      setCategory(
        resolvedProfessionalType === "generic" && p.category === "veterinari"
          ? "altro"
          : (p.category ?? "")
      );
      setPhone(p.phone ?? "");
      setEmail(p.email ?? "");
      setWebsite(p.website ?? "");
      setAddress(p.address ?? "");
      setCity(p.city ?? "");
      setProvince(p.province ?? "");
      setDescription(p.description ?? "");

      try {
        const raw = localStorage.getItem(prefsStorageKey(user.id));
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<LocalPrefs>;
          setPrefs({
            ...DEFAULT_PREFS,
            ...parsed,
          });
        }
      } catch {
        setPrefs(DEFAULT_PREFS);
      }

      setLoading(false);

      await loadOperators();
      await refreshOperatorSession(initialWorkstationKey);
    }

    void load();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!allowedMacro.some((item) => item.key === category)) {
      setCategory(professionalType === "veterinarian" ? "veterinari" : "altro");
    }
  }, [allowedMacro, category, professionalType]);

  useEffect(() => {
    let alive = true;

    async function loadVetinfoStatus() {
      if (professionalType !== "veterinarian") return;

      setLoadingVetinfo(true);

      try {
        const res = await fetch("/api/integrations/vetinfo/status", {
          method: "GET",
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setVetinfoConfigured(false);
          setVetinfoStatus("not_configured");
          return;
        }

        setVetinfoConfigured(Boolean(json?.configured));
        setVetinfoStatus((json?.status as VetinfoStatus) || "not_configured");
      } catch {
        if (!alive) return;
        setVetinfoConfigured(false);
        setVetinfoStatus("not_configured");
      } finally {
        if (alive) {
          setLoadingVetinfo(false);
        }
      }
    }

    void loadVetinfoStatus();

    return () => {
      alive = false;
    };
  }, [professionalType]);

  useEffect(() => {
    if (!selectedSessionOperatorId && operators.length > 0) {
      setSelectedSessionOperatorId(operators[0].clinicOperatorId);
    }
  }, [operators, selectedSessionOperatorId]);

  useEffect(() => {
    if (!workstationKey || !currentOperatorSession) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const result = await heartbeatOperatorSession(workstationKey);
        setCurrentOperatorSession(result.session);
      } catch {
        // ignore heartbeat errors
      }
    }, 120000);

    return () => {
      window.clearInterval(timer);
    };
  }, [workstationKey, currentOperatorSession]);

  const currentDefaultViewLabel = useMemo(() => {
    switch (prefs.defaultView) {
      case "animali":
        return "Animali in gestione";
      case "scansiona":
        return "Scansiona";
      default:
        return "Dashboard";
    }
  }, [prefs.defaultView]);

  async function saveProfile() {
    setError(null);
    setInfo(null);

    if (!pro) {
      setError("Scheda professionista non trovata.");
      return;
    }

    if (professionalType === "generic" && category === "veterinari") {
      setError("Un professionista non veterinario non può usare la categoria Veterinari.");
      return;
    }

    if (professionalType === "veterinarian" && category !== "veterinari") {
      setError("Un account veterinario deve mantenere la categoria Veterinari.");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Inserisci un nome struttura / professionista valido.");
      return;
    }

    if (city.trim().length < 2) {
      setError("Inserisci una città valida.");
      return;
    }

    if (province.trim().length !== 2) {
      setError("Inserisci una provincia valida di 2 lettere.");
      return;
    }

    if (phone.trim().length < 6) {
      setError("Inserisci un numero di telefono valido.");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Inserisci una email valida.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Inserisci un indirizzo valido.");
      return;
    }

    setSavingProfile(true);

    try {
      const payload = {
        display_name: displayName.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim() || null,
        address: address.trim(),
        city: city.trim(),
        province: normalizeProvince(province),
        description: description.trim() || null,
      };

      const { error: upErr } = await supabase.from("professionals").update(payload).eq("id", pro.id);

      if (upErr) {
        throw upErr;
      }

      setPro((prev) =>
        prev
          ? {
              ...prev,
              display_name: displayName.trim(),
              category,
              phone: phone.trim(),
              email: email.trim(),
              website: website.trim() || null,
              address: address.trim(),
              city: city.trim(),
              province: normalizeProvince(province),
              description: description.trim() || null,
            }
          : prev
      );

      setInfo("Profilo professionista salvato ✅");
    } catch {
      setError("Errore nel salvataggio del profilo. Riprova.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreferences() {
    setError(null);
    setInfo(null);

    if (!userId) {
      setError("Utente non disponibile.");
      return;
    }

    setSavingPrefs(true);

    try {
      localStorage.setItem(prefsStorageKey(userId), JSON.stringify(prefs));
      setInfo("Preferenze e notifiche salvate su questo dispositivo ✅");
    } catch {
      setError("Errore nel salvataggio locale delle preferenze.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      router.replace("/professionisti/login");
    }
  }

  async function handleConnectVetinfo() {
    setError(null);
    setInfo(null);
    setConnectingVetinfo(true);

    try {
      const res = await fetch("/api/integrations/vetinfo/auth/start", {
        method: "GET",
        cache: "no-store",
        headers: {
          ...(await authHeaders()),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json?.error === "VETINFO_NOT_CONFIGURED") {
          setError(
            "Integrazione REV non ancora configurata. Appena arrivano i dati definitivi IZS attiviamo il collegamento."
          );
          return;
        }

        if (json?.error === "UNAUTHORIZED") {
          setError("Sessione non valida. Rientra nel portale e riprova.");
          return;
        }

        setError("Impossibile avviare il collegamento REV.");
        return;
      }

      if (!json?.authorizeUrl) {
        setError("Risposta collegamento REV incompleta.");
        return;
      }

      window.location.href = json.authorizeUrl;
    } catch {
      setError("Errore di rete durante l’avvio del collegamento REV.");
    } finally {
      setConnectingVetinfo(false);
    }
  }

  async function handleCreateOperator() {
    setError(null);
    setInfo(null);

    if (!canManageOperators) {
      setError("Solo il direttore sanitario o un gestore autorizzato può creare operatori.");
      return;
    }

    if (!opFirstName.trim()) {
      setError("Nome operatore obbligatorio.");
      return;
    }

    if (!opLastName.trim()) {
      setError("Cognome operatore obbligatorio.");
      return;
    }

    if (!opRole.trim()) {
      setError("Ruolo operatore obbligatorio.");
      return;
    }

    if (!opInitialPin.trim() || !/^\d{4,8}$/.test(opInitialPin.trim())) {
      setError("PIN iniziale obbligatorio: 4-8 cifre numeriche.");
      return;
    }

    if (opIsVeterinarian) {
      if (!opFnoviNumber.trim() || !opFnoviProvince.trim()) {
        setError("Per i veterinari FNOVI e provincia albo sono obbligatori.");
        return;
      }
      if (!opTaxCode.trim()) {
        setError("Per i veterinari il codice fiscale è obbligatorio.");
        return;
      }
      if (!opEmail.trim() || !isEmailValid(opEmail.trim())) {
        setError("Per i veterinari l'email è obbligatoria.");
        return;
      }
    }

    setSavingOperator(true);

    try {
      await createClinicOperatorClient({
        firstName: opFirstName.trim(),
        lastName: opLastName.trim(),
        displayName: opDisplayName.trim() || undefined,
        role: opRole.trim(),
        isVeterinarian: opIsVeterinarian,
        isPrescriber: opIsPrescriber,
        fnoviNumber: opIsVeterinarian ? opFnoviNumber.trim() : undefined,
        fnoviProvince: opIsVeterinarian ? opFnoviProvince.trim() : undefined,
        taxCode: opIsVeterinarian ? opTaxCode.trim() : undefined,
        email: opEmail.trim() || undefined,
        phone: opPhone.trim() || undefined,
        approvalNotes: opApprovalNotes.trim() || undefined,
        canUseRev: opIsVeterinarian ? opCanUseRev : false,
        initialPin: opInitialPin.trim(),
      });

      setOpFirstName("");
      setOpLastName("");
      setOpDisplayName("");
      setOpRole("");
      setOpIsVeterinarian(true);
      setOpIsPrescriber(true);
      setOpFnoviNumber("");
      setOpFnoviProvince("");
      setOpTaxCode("");
      setOpEmail("");
      setOpPhone("");
      setOpInitialPin("");
      setOpCanUseRev(false);
      setOpApprovalNotes("");

      setInfo("Operatore clinico creato");
      await loadOperators();
      await refreshOperatorSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore creazione operatore.");
    } finally {
      setSavingOperator(false);
    }
  }

  async function handleActivateOrSwitchOperatorSession() {
  setError(null);
  setInfo(null);

  if (!workstationKey) {
    setError("Workstation non disponibile.");
    return;
  }

  if (!selectedSessionOperatorId) {
    setError("Seleziona un operatore.");
    return;
  }

  if (!/^\d{4,8}$/.test(sessionPin.trim())) {
    setError("Inserisci un PIN valido di 4-8 cifre.");
    return;
  }

  setSavingOperatorSession(true);

  try {
    const activeClinicOperatorId = currentOperatorSession?.activeClinicOperatorId ?? null;

    const isSwitch =
      Boolean(activeClinicOperatorId) &&
      activeClinicOperatorId !== selectedSessionOperatorId;

    const result = isSwitch
      ? await switchOperatorSession({
          workstationKey,
          clinicOperatorId: selectedSessionOperatorId,
          pin: sessionPin.trim(),
        })
      : await activateOperatorSession({
          workstationKey,
          clinicOperatorId: selectedSessionOperatorId,
          pin: sessionPin.trim(),
        });

    if ("session" in result && result.session) {
      setFirstAccessPinChangeRequired(false);
      setFirstAccessOperatorLabel("");
      setFirstAccessCurrentPin("");
      setFirstAccessNewPin("");
      setFirstAccessConfirmPin("");

      setCurrentOperatorSession(result.session);
      setSessionPin("");
      setInfo(
        isSwitch
          ? `Operatore attivo aggiornato ✅ ${result.session.activeOperatorLabel}`
          : `Sessione operatore attivata ✅ ${result.session.activeOperatorLabel}`
      );
      return;
    }

    if ("requiresPinChange" in result && result.requiresPinChange) {
      setCurrentOperatorSession(null);
      setFirstAccessPinChangeRequired(true);
      setFirstAccessOperatorLabel(result.operatorLabel || "");
      setFirstAccessCurrentPin(sessionPin.trim());
      setFirstAccessNewPin("");
      setFirstAccessConfirmPin("");
      setSessionPin("");
      setInfo(
        `PIN temporaneo verificato per ${result.operatorLabel}. Imposta ora il PIN personale.`
      );
      return;
    }

    setError("Risposta sessione operatore non valida.");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Errore sessione operatore.");
  } finally {
    setSavingOperatorSession(false);
  }
}

  async function handleChangeFirstAccessPin() {
    setError(null);
    setInfo(null);

    if (!workstationKey) {
      setError("Workstation non disponibile.");
      return;
    }

    if (!firstAccessPinChangeRequired) {
      setError("Nessun cambio PIN obbligatorio in corso.");
      return;
    }

    if (!/^\d{4,8}$/.test(firstAccessCurrentPin.trim())) {
      setError("PIN attuale non valido: usa 4-8 cifre.");
      return;
    }

    if (!/^\d{4,8}$/.test(firstAccessNewPin.trim())) {
      setError("Nuovo PIN non valido: usa 4-8 cifre.");
      return;
    }

    if (firstAccessNewPin.trim() !== firstAccessConfirmPin.trim()) {
      setError("Conferma PIN non corrispondente.");
      return;
    }

    if (firstAccessCurrentPin.trim() === firstAccessNewPin.trim()) {
      setError("Il nuovo PIN deve essere diverso da quello temporaneo.");
      return;
    }

    setSavingFirstAccessPinChange(true);

    try {
      const result = await changePinFirstAccess({
        workstationKey,
        currentPin: firstAccessCurrentPin.trim(),
        newPin: firstAccessNewPin.trim(),
      });

      setCurrentOperatorSession(result.session);
      setFirstAccessPinChangeRequired(false);
      setFirstAccessOperatorLabel("");
      setFirstAccessCurrentPin("");
      setFirstAccessNewPin("");
      setFirstAccessConfirmPin("");
      setSessionPin("");
      setInfo(`PIN personale impostato ✅ ${result.session.activeOperatorLabel}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore cambio PIN primo accesso.");
    } finally {
      setSavingFirstAccessPinChange(false);
    }
  }

  async function handleCloseOperatorSession() {
    setError(null);
    setInfo(null);

    if (!workstationKey) {
      setError("Workstation non disponibile.");
      return;
    }

    setSavingOperatorSession(true);

    try {
      await logoutOperatorSession(workstationKey);
      setCurrentOperatorSession(null);
      setSessionPin("");
      setFirstAccessPinChangeRequired(false);
      setFirstAccessOperatorLabel("");
      setFirstAccessCurrentPin("");
      setFirstAccessNewPin("");
      setFirstAccessConfirmPin("");
      setInfo("Sessione operatore chiusa ✅");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore chiusura sessione.");
    } finally {
      setSavingOperatorSession(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Impostazioni</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Gestisci profilo professionista, preferenze operative, notifiche, sicurezza e operatori
          della clinica.
        </p>
      </div>

      {error || info ? (
        <div
          className={[
            "rounded-2xl border p-4 text-sm shadow-sm",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error || info}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {professionalType === "veterinarian" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-zinc-500">REV / VETINFO</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">Collegamento personale REV</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Questa sezione prepara il nuovo flusso prescrittivo personale del veterinario. Il
              collegamento reale SPID/CAS verrà completato appena saranno definiti gli ultimi dati
              operativi.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-zinc-500">STATO</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {loadingVetinfo ? "Verifica in corso..." : vetinfoStatusLabel(vetinfoStatus)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-zinc-500">CONFIGURAZIONE</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {vetinfoConfigured ? "Presente" : "Non attiva"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-zinc-500">IDENTITÀ</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  Collegamento personale veterinario
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConnectVetinfo}
                disabled={connectingVetinfo}
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {connectingVetinfo ? "Avvio..." : "Collega REV"}
              </button>

              <span className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-600">
                Emissione prescrizioni • in preparazione
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Direzione impostata</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
                <li>• collegamento REV personale del singolo veterinario</li>
                <li>• nessun account REV condiviso di clinica</li>
                <li>• base pronta per prescrizioni collegate alla cartella clinica</li>
              </ul>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">OPERATORI CLINICA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Gestione operatori</h2>
          <p className="mt-2 text-sm text-zinc-600">
            La clinica è verificata da UNIMALIA. La validazione e gestione dei sublogin è
            responsabilità del direttore sanitario o dei gestori autorizzati.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-zinc-500">ATTORE ATTIVO</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">
                {actorOperator?.label || "Non disponibile"}
              </p>
              <p className="mt-1 text-xs text-zinc-600">{actorOperator?.role || "—"}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-zinc-500">PERMESSI</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">
                {canManageOperators ? "Gestione operatori attiva" : "Solo lettura / non autorizzato"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-zinc-500">OPERATORI</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">
                {loadingOperators ? "Caricamento..." : operators.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {operators.map((operator) => (
              <div
                key={operator.clinicOperatorId}
                className="rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{operator.label}</div>
                    <div className="mt-1 text-sm text-zinc-600">{operator.role}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                        {operator.isVet ? "Veterinario" : "Operatore"}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                        {operatorStatusLabel(operator.approvalStatus)}
                      </span>
                      {operator.isMedicalDirector ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                          Direttore sanitario
                        </span>
                      ) : null}
                      {operator.canManageOperators ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                          Gestore operatori
                        </span>
                      ) : null}
                      {operator.canUseRev ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                          REV abilitabile
                        </span>
                      ) : null}
                    </div>
                    {operator.isVet ? (
                      <div className="mt-2 text-xs text-zinc-500">
                        FNOVI: {operator.fnoviNumber || "—"}
                        {operator.fnoviProvince ? ` • ${operator.fnoviProvince}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canManageOperators ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="text-sm font-semibold text-zinc-900">Aggiungi operatore</div>
              <p className="mt-1 text-sm text-zinc-600">
                Per i veterinari inserisci già i dati necessari per il futuro collegamento REV.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-900">Nome</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opFirstName}
                    onChange={(e) => setOpFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">Cognome</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opLastName}
                    onChange={(e) => setOpLastName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">Nome visibile</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opDisplayName}
                    onChange={(e) => setOpDisplayName(e.target.value)}
                    placeholder="Opzionale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">Ruolo</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opRole}
                    onChange={(e) => setOpRole(e.target.value)}
                    placeholder="Es. Veterinario collaboratore"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={opIsVeterinarian}
                    onChange={(e) => setOpIsVeterinarian(e.target.checked)}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Operatore veterinario</p>
                    <p className="text-xs text-zinc-500">
                      Se attivo, vengono richiesti FNOVI e dati pronti per REV.
                    </p>
                  </div>
                </label>

                {opIsVeterinarian ? (
                  <>
                    <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:col-span-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={opIsPrescriber}
                        onChange={(e) => setOpIsPrescriber(e.target.checked)}
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">Prescrittore</p>
                        <p className="text-xs text-zinc-500">
                          Abilita il profilo a futuri flussi REV personali.
                        </p>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-zinc-900">Numero FNOVI</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                        value={opFnoviNumber}
                        onChange={(e) => setOpFnoviNumber(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-900">Provincia albo</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
                        value={opFnoviProvince}
                        onChange={(e) => setOpFnoviProvince(e.target.value.toUpperCase())}
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-900">Codice fiscale</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                        value={opTaxCode}
                        onChange={(e) => setOpTaxCode(e.target.value.toUpperCase())}
                      />
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:col-span-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={opCanUseRev}
                        onChange={(e) => setOpCanUseRev(e.target.checked)}
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">Abilitabile REV</p>
                        <p className="text-xs text-zinc-500">
                          Mantiene il profilo pronto per collegamento personale SPID/CIE/CNS.
                        </p>
                      </div>
                    </label>
                  </>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-zinc-900">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opEmail}
                    onChange={(e) => setOpEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">Telefono</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opPhone}
                    onChange={(e) => setOpPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">
                    PIN iniziale operatore
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={opInitialPin}
                    onChange={(e) => setOpInitialPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="4-8 cifre"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Il direttore sanitario assegna il PIN iniziale. Al primo accesso l’operatore
                    dovrà cambiarlo.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-900">Note interne</label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    rows={4}
                    value={opApprovalNotes}
                    onChange={(e) => setOpApprovalNotes(e.target.value)}
                    placeholder="Annotazioni iniziali per direttore sanitario / struttura"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleCreateOperator}
                    disabled={savingOperator}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {savingOperator ? "Creazione..." : "Crea operatore"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold text-zinc-900">Sessione operatore corrente</div>
            <p className="mt-1 text-sm text-zinc-600">
              Stato della sessione attiva su questa workstation per accesso condiviso.
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Workstation:</span>
                  <span className="font-mono text-right text-zinc-900 break-all">
                    {workstationKey || "Non disponibile"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Operatore attivo:</span>
                  <span className="font-medium text-zinc-900">
                    {loadingOperatorSession
                      ? "Caricamento..."
                      : currentOperatorSession?.activeOperatorLabel || "Nessuno"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Stato:</span>
                  <span className="font-medium text-zinc-900">
                    {loadingOperatorSession
                      ? "Verifica in corso..."
                      : currentOperatorSession
                        ? "Sessione attiva"
                        : "Sessione non attiva"}
                  </span>
                </div>
                {currentOperatorSession?.expiresAt ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-600">Scadenza:</span>
                    <span className="text-right text-zinc-900">
                      {new Date(currentOperatorSession.expiresAt).toLocaleString("it-IT")}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-900">Operatore</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                    value={selectedSessionOperatorId}
                    onChange={(e) => setSelectedSessionOperatorId(e.target.value)}
                  >
                    <option value="">Seleziona operatore</option>
                    {operators
                      .filter((operator) => operator.isActive)
                      .map((operator) => (
                        <option key={operator.clinicOperatorId} value={operator.clinicOperatorId}>
                          {operator.label} — {operator.role}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">PIN operatore</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                    value={sessionPin}
                    onChange={(e) => setSessionPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="4-8 cifre"
                    disabled={firstAccessPinChangeRequired}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleActivateOrSwitchOperatorSession}
                  disabled={
                    savingOperatorSession ||
                    loadingOperatorSession ||
                    firstAccessPinChangeRequired
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {savingOperatorSession
                    ? "Salvataggio..."
                    : currentOperatorSession
                      ? "Attiva / cambia operatore"
                      : "Attiva sessione operatore"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseOperatorSession}
                  disabled={savingOperatorSession || (!currentOperatorSession && !firstAccessPinChangeRequired)}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Chiudi sessione
                </button>
                <button
                  type="button"
                  onClick={() => void refreshOperatorSession()}
                  disabled={loadingOperatorSession || savingOperatorSession || savingFirstAccessPinChange}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Aggiorna stato
                </button>
              </div>

              {firstAccessPinChangeRequired ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-900">
                    Primo accesso: cambio PIN obbligatorio
                  </div>
                  <p className="mt-1 text-sm text-amber-900">
                    {firstAccessOperatorLabel
                      ? `L’operatore ${firstAccessOperatorLabel} sta usando un PIN temporaneo assegnato dal direttore sanitario.`
                      : "Stai usando un PIN temporaneo assegnato dal direttore sanitario."}{" "}
                    Imposta ora il PIN personale per continuare.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-900">PIN attuale</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                        value={firstAccessCurrentPin}
                        onChange={(e) =>
                          setFirstAccessCurrentPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="PIN temporaneo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-900">Nuovo PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                        value={firstAccessNewPin}
                        onChange={(e) => setFirstAccessNewPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="4-8 cifre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-900">
                        Conferma nuovo PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                        value={firstAccessConfirmPin}
                        onChange={(e) =>
                          setFirstAccessConfirmPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Ripeti PIN"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleChangeFirstAccessPin}
                      disabled={savingFirstAccessPinChange}
                      className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {savingFirstAccessPinChange ? "Salvataggio..." : "Imposta PIN personale"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFirstAccessPinChangeRequired(false);
                        setFirstAccessOperatorLabel("");
                        setFirstAccessCurrentPin("");
                        setFirstAccessNewPin("");
                        setFirstAccessConfirmPin("");
                        setSessionPin("");
                      }}
                      disabled={savingFirstAccessPinChange}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">PROFILO PROFESSIONISTA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Profilo</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Nome struttura, contatti, indirizzo, categoria e dati pubblici della scheda.
          </p>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Nome struttura / professionista
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Categoria</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {allowedMacro.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Telefono</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Sito</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Indirizzo</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-900">Città</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900">Provincia</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 uppercase outline-none focus:border-zinc-900"
                  value={province}
                  onChange={(e) => setProvince(e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {savingProfile ? "Salvataggio..." : "Salva profilo"}
              </button>

              <Link
                href="/professionisti/nuovo/modifica"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Modifica scheda completa
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">PREFERENZE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Preferenze</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Configurazioni del portale e personalizzazioni operative. Salvataggio locale su questo
            dispositivo.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Vista iniziale dashboard
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={prefs.defaultView}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    defaultView: e.target.value as LocalPrefs["defaultView"],
                  }))
                }
              >
                <option value="dashboard">Dashboard</option>
                <option value="animali">Animali in gestione</option>
                <option value="scansiona">Scansiona</option>
              </select>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.compactMode}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    compactMode: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Modalità compatta</p>
                <p className="text-xs text-zinc-500">
                  Riduce spazi e densità dei contenuti nel portale.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.internalNotesEnabled}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    internalNotesEnabled: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Preferenze operative struttura
                </p>
                <p className="text-xs text-zinc-500">
                  Mantiene attive le opzioni operative locali del portale.
                </p>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">NOTIFICHE</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Notifiche</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Gestione avvisi per richieste accesso, consulti e aggiornamenti clinici. Salvataggio
            locale su questo dispositivo.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyAccessRequests}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyAccessRequests: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Richieste accesso</p>
                <p className="text-xs text-zinc-500">
                  Avvisi per nuove richieste o cambi di stato.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyConsults}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyConsults: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">Consulti e messaggi</p>
                <p className="text-xs text-zinc-500">
                  Avvisi per consulti in arrivo e messaggi dal portale.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs.notifyClinicalUpdates}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    notifyClinicalUpdates: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Aggiornamenti clinici e alert
                </p>
                <p className="text-xs text-zinc-500">
                  Avvisi per attività cliniche rilevanti e aggiornamenti rapidi.
                </p>
              </div>
            </label>

            <button
              type="button"
              onClick={savePreferences}
              disabled={savingPrefs}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingPrefs ? "Salvataggio..." : "Salva preferenze e notifiche"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">SICUREZZA</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">Sicurezza</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sessione corrente, logout e accessi collegati all’account professionale.
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Sessione attiva</p>
              <p className="mt-1 text-sm text-zinc-600">
                Account:{" "}
                <span className="font-medium text-zinc-800">
                  {userEmail || "Non disponibile"}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Vista iniziale preferita: {currentDefaultViewLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Gestione accessi</p>
              <p className="mt-1 text-sm text-zinc-600">
                Controlla richieste accesso e stato operativo della tua area professionisti.
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/professionisti/richieste-accesso"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Apri richieste accesso
                </Link>

                {pro ? (
                  <Link
                    href={`/servizi/${pro.id}?from=professionisti`}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Vedi scheda pubblica
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Logout e controllo accessi</p>
              <p className="mt-1 text-sm text-zinc-600">
                Esci in sicurezza dal portale professionisti.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {loggingOut ? "Uscita..." : "Logout dal portale"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}