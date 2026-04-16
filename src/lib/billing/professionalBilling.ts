import { createClient } from "@supabase/supabase-js";
import {
  createFicIssuedDocument,
  ensureFicClient,
  getFicCompanyId,
} from "./fattureInCloud";

type ProfessionalRow = {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  legal_name?: string | null;
  tax_code?: string | null;
  vat_number?: string | null;
  pec?: string | null;
  sdi_code?: string | null;
  invoice_receiver_type?: string | null;
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildDisplayName(professional: ProfessionalRow) {
  return (
    professional.business_name ||
    professional.legal_name ||
    [professional.first_name, professional.last_name].filter(Boolean).join(" ") ||
    "Professionista UNIMALIA"
  );
}

export async function getProfessionalBillingProfile(professionalId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("professionals")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      business_name,
      legal_name,
      tax_code,
      vat_number,
      pec,
      sdi_code,
      invoice_receiver_type
    `)
    .eq("id", professionalId)
    .single();

  if (error || !data) {
    throw new Error("Professional not found");
  }

  return data as ProfessionalRow;
}

export async function createBillingDocumentForProfessionalPayment(params: {
  professionalId: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeEventId: string;
  amountCents: number;
  currency: string;
  sourceId?: string | null;
  sourceDescription: string;
}) {
  const supabase = getServiceSupabase();

  const professional = await getProfessionalBillingProfile(params.professionalId);

  const billingSnapshot = {
    professional_id: professional.id,
    user_id: professional.user_id ?? null,
    display_name: buildDisplayName(professional),
    first_name: professional.first_name ?? null,
    last_name: professional.last_name ?? null,
    business_name: professional.business_name ?? null,
    legal_name: professional.legal_name ?? null,
    tax_code: professional.tax_code ?? null,
    vat_number: professional.vat_number ?? null,
    pec: professional.pec ?? null,
    sdi_code: professional.sdi_code ?? null,
    invoice_receiver_type: professional.invoice_receiver_type ?? null,
  };

  const { id: ficClientId } = await ensureFicClient({
    name: billingSnapshot.display_name,
    vatNumber: professional.vat_number,
    taxCode: professional.tax_code,
    certifiedEmail: professional.pec,
    recipientCode: professional.sdi_code,
  });

  const issued = await createFicIssuedDocument({
    clientId: ficClientId,
    amountCents: params.amountCents,
    currency: params.currency,
    description: params.sourceDescription,
    documentType: "invoice",
  });

  const ficDocumentId = issued?.data?.id ?? null;
  const ficDocumentNumber = issued?.data?.number ?? null;
  const ficDocumentType = issued?.data?.type ?? "invoice";

  const { error: insertError } = await supabase
    .from("billing_document_sync")
    .insert({
      professional_id: professional.id,
      user_id: professional.user_id ?? null,
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_event_id: params.stripeEventId,
      amount_cents: params.amountCents,
      currency: params.currency.toLowerCase(),
      payment_status: "paid",
      source_type: "professional_payment",
      source_id: params.sourceId ?? null,
      source_description: params.sourceDescription,
      billing_snapshot: billingSnapshot,
      fic_company_id: getFicCompanyId(),
      fic_client_id: ficClientId,
      fic_document_id: ficDocumentId,
      fic_document_number: ficDocumentNumber,
      fic_document_type: ficDocumentType,
      sync_status: ficDocumentId ? "completed" : "failed",
      sync_error: ficDocumentId ? null : "Missing Fatture in Cloud document id",
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    ficClientId,
    ficDocumentId,
    ficDocumentNumber,
    ficDocumentType,
    billingSnapshot,
  };
}

export async function markBillingSyncFailed(params: {
  professionalId: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeEventId: string;
  amountCents: number;
  currency: string;
  sourceId?: string | null;
  sourceDescription: string;
  errorMessage: string;
}) {
  const supabase = getServiceSupabase();

  const professional = await getProfessionalBillingProfile(params.professionalId);

  const billingSnapshot = {
    professional_id: professional.id,
    user_id: professional.user_id ?? null,
    display_name: buildDisplayName(professional),
    tax_code: professional.tax_code ?? null,
    vat_number: professional.vat_number ?? null,
    pec: professional.pec ?? null,
    sdi_code: professional.sdi_code ?? null,
    invoice_receiver_type: professional.invoice_receiver_type ?? null,
  };

  const { error } = await supabase
    .from("billing_document_sync")
    .insert({
      professional_id: professional.id,
      user_id: professional.user_id ?? null,
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_event_id: params.stripeEventId,
      amount_cents: params.amountCents,
      currency: params.currency.toLowerCase(),
      payment_status: "paid",
      source_type: "professional_payment",
      source_id: params.sourceId ?? null,
      source_description: params.sourceDescription,
      billing_snapshot: billingSnapshot,
      fic_company_id: getFicCompanyId(),
      sync_status: "failed",
      sync_error: params.errorMessage,
    });

  if (error) {
    throw new Error(error.message);
  }
}
