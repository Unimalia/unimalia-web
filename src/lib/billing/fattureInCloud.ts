const FIC_BASE_URL = "https://api-v2.fattureincloud.it";

type FattureInCloudClientPayload = {
  name: string;
  vatNumber?: string | null;
  taxCode?: string | null;
  email?: string | null;
  certifiedEmail?: string | null;
  recipientCode?: string | null;
};

type FattureInCloudIssuedDocumentPayload = {
  clientId: number;
  amountCents: number;
  description: string;
  currency?: string;
  documentType?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getConfig() {
  return {
    accessToken: getRequiredEnv("FATTURE_IN_CLOUD_ACCESS_TOKEN"),
    companyId: Number(getRequiredEnv("FATTURE_IN_CLOUD_COMPANY_ID")),
  };
}

async function ficFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken } = getConfig();

  const response = await fetch(`${FIC_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fatture in Cloud error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function createFicClient(payload: FattureInCloudClientPayload) {
  const { companyId } = getConfig();

  const body = {
    data: {
      type: "client",
      name: payload.name,
      vat_number: payload.vatNumber || undefined,
      tax_code: payload.taxCode || undefined,
      mail: payload.email || undefined,
      certified_email: payload.certifiedEmail || undefined,
      recipient_code: payload.recipientCode || undefined,
    },
  };

  return ficFetch<{
    data?: {
      id?: number;
      name?: string;
    };
  }>(`/c/${companyId}/entities/clients`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createFicIssuedDocument(
  payload: FattureInCloudIssuedDocumentPayload
) {
  const { companyId } = getConfig();

  const currency = (payload.currency || "EUR").toUpperCase();
  const documentType = payload.documentType || "invoice";
  const amount = payload.amountCents / 100;

  const body = {
    data: {
      type: documentType,
      entity: {
        id: payload.clientId,
      },
      currency: {
        id: currency,
      },
      items_list: [
        {
          name: payload.description,
          qty: 1,
          net_price: amount,
        },
      ],
      payments_list: [],
    },
  };

  return ficFetch<{
    data?: {
      id?: number;
      number?: string;
      type?: string;
    };
  }>(`/c/${companyId}/issued_documents`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function ensureFicClient(payload: FattureInCloudClientPayload) {
  const created = await createFicClient(payload);

  const clientId = created?.data?.id;
  if (!clientId) {
    throw new Error("Unable to create Fatture in Cloud client");
  }

  return {
    id: clientId,
    raw: created,
  };
}

export function getFicCompanyId() {
  return Number(getRequiredEnv("FATTURE_IN_CLOUD_COMPANY_ID"));
}