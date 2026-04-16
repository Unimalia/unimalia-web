import { authHeaders } from "@/lib/client/authHeaders";

export type ClinicOperatorItem = {
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

type ListResponse = {
  ok: true;
  operators: ClinicOperatorItem[];
  actor: ClinicOperatorItem | null;
};

type CreateResponse = {
  ok: true;
  operator: ClinicOperatorItem;
};

type CurrentSessionResponse = {
  ok: true;
  workstationKey: string;
  currentUserId: string;
  currentUserClinicOperatorId: string | null;
  currentUserHasPin: boolean;
  session: {
    id: string;
    organizationId: string;
    workstationKey: string;
    activeClinicOperatorId: string | null;
    activeUserId: string | null;
    activeProfessionalId: string | null;
    activeOperatorLabel: string | null;
    activeOperatorRole: string | null;
    activeOperatorIsVeterinarian: boolean | null;
    activeOperatorFnoviNumber: string | null;
    activeOperatorFnoviProvince: string | null;
    pinVerifiedAt: string | null;
    lastSeenAt: string | null;
    expiresAt: string | null;
    signatureMode: string | null;
  } | null;
  availableOperators: ClinicOperatorItem[];
};

type SetPinResponse = {
  ok: true;
};

type ActivateSessionResponse = {
  ok: true;
  session: {
    id: string;
    organizationId: string;
    workstationKey: string;
    activeClinicOperatorId: string;
    activeUserId: string | null;
    activeProfessionalId: string | null;
    activeOperatorLabel: string;
    activeOperatorRole: string;
    activeOperatorIsVeterinarian: boolean;
    activeOperatorFnoviNumber: string | null;
    activeOperatorFnoviProvince: string | null;
    pinVerifiedAt: string;
    lastSeenAt: string;
    expiresAt: string;
    signatureMode: string;
  };
};

type HeartbeatResponse = {
  ok: true;
  session: {
    id: string;
    organizationId: string;
    workstationKey: string;
    activeUserId: string | null;
    activeProfessionalId: string | null;
    activeOperatorLabel: string | null;
    pinVerifiedAt: string | null;
    lastSeenAt: string | null;
    expiresAt: string | null;
  } | null;
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
    throw new Error(json?.error || "Errore richiesta operatori clinica.");
  }

  return json;
}

export async function listClinicOperatorsClient() {
  return await jsonFetch<ListResponse>("/api/clinic/operators/list", {
    method: "GET",
    cache: "no-store",
  });
}

export async function createClinicOperatorClient(input: {
  firstName: string;
  lastName: string;
  displayName?: string | null;
  role: string;
  isVeterinarian: boolean;
  isPrescriber?: boolean;
  fnoviNumber?: string | null;
  fnoviProvince?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phone?: string | null;
  approvalNotes?: string | null;
  canUseRev?: boolean;
  initialPin: string;
}) {
  return await jsonFetch<CreateResponse>("/api/clinic/operators/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getCurrentOperatorSessionClient(workstationKey: string) {
  return await jsonFetch<CurrentSessionResponse>("/api/clinic/operator-session/current", {
    method: "GET",
    cache: "no-store",
    headers: {
      "x-workstation-key": workstationKey,
    },
  });
}

export async function setOperatorPinClient(input: {
  pin: string;
  clinicOperatorId: string;
}) {
  return await jsonFetch<SetPinResponse>("/api/clinic/operator-session/set-pin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function activateOperatorSessionClient(input: {
  pin: string;
  clinicOperatorId: string;
}) {
  return await jsonFetch<ActivateSessionResponse>("/api/clinic/operator-session/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function heartbeatOperatorSessionClient(workstationKey: string) {
  return await jsonFetch<HeartbeatResponse>("/api/clinic/operator-session/heartbeat", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });
}