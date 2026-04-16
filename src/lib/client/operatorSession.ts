import { authHeaders } from "@/lib/client/authHeaders";

export type OperatorOption = {
  clinicOperatorId: string;
  userId: string | null;
  professionalId: string | null;
  label: string;
  role: string;
  isVet: boolean;
  isPrescriber: boolean;
  fnoviNumber: string | null;
  fnoviProvince: string | null;
  approvalStatus: string;
  isActive: boolean;
  canUseRev: boolean;
  isMedicalDirector: boolean;
  canManageOperators: boolean;
};

export type OperatorSession = {
  id: string;
  organizationId: string;
  workstationKey: string;
  activeClinicOperatorId: string | null;
  activeUserId: string | null;
  activeProfessionalId: string | null;
  activeOperatorLabel: string;
  activeOperatorRole: string | null;
  activeOperatorIsVeterinarian: boolean | null;
  activeOperatorFnoviNumber: string | null;
  activeOperatorFnoviProvince: string | null;
  pinVerifiedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  signatureMode: string | null;
};

type CurrentResponse = {
  ok: true;
  workstationKey: string;
  currentUserId: string;
  currentUserClinicOperatorId: string | null;
  currentUserHasPin: boolean;
  session: OperatorSession | null;
  availableOperators: OperatorOption[];
};

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(await authHeaders()),
    },
  });

  const json = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    throw new Error(json?.error || "Errore richiesta operatore.");
  }

  return json;
}

export async function getOperatorSessionCurrent(workstationKey: string) {
  return await jsonFetch<CurrentResponse>("/api/clinic/operator-session/current", {
    method: "GET",
    headers: {
      "x-workstation-key": workstationKey,
    },
    cache: "no-store",
  });
}

export async function activateOperatorSession(params: {
  workstationKey: string;
  clinicOperatorId: string;
  pin: string;
}) {
  return await jsonFetch<{
    ok: true;
    session: OperatorSession;
  }>("/api/clinic/operator-session/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workstation-key": params.workstationKey,
    },
    body: JSON.stringify({
      clinicOperatorId: params.clinicOperatorId,
      pin: params.pin,
    }),
  });
}

export async function switchOperatorSession(params: {
  workstationKey: string;
  clinicOperatorId: string;
  pin: string;
}) {
  return await jsonFetch<{
    ok: true;
    session: OperatorSession;
  }>("/api/clinic/operator-session/switch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workstation-key": params.workstationKey,
    },
    body: JSON.stringify({
      clinicOperatorId: params.clinicOperatorId,
      pin: params.pin,
    }),
  });
}

export async function logoutOperatorSession(workstationKey: string) {
  return await jsonFetch<{ ok: true }>("/api/clinic/operator-session/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workstation-key": workstationKey,
    },
    body: JSON.stringify({}),
  });
}

export async function heartbeatOperatorSession(workstationKey: string) {
  return await jsonFetch<{
    ok: true;
    session: OperatorSession | null;
  }>("/api/clinic/operator-session/heartbeat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-workstation-key": workstationKey,
    },
    body: JSON.stringify({}),
  });
}

export async function setMyOperatorPin(clinicOperatorId: string, pin: string) {
  return await jsonFetch<{ ok: true }>("/api/clinic/operator-session/set-pin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clinicOperatorId, pin }),
  });
}
