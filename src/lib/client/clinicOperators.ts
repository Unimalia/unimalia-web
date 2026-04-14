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