import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getEmergencyTokenPrefix,
  hashEmergencyToken,
  hashValue,
  normalizeEmergencyToken,
} from "@/lib/emergency/token";

export type EmergencyProfile = {
  animal_id: string;
  enabled: boolean;
  animal_name: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  weight_kg: number | null;
  blood_type: string | null;
  allergies: string | null;
  active_therapies: string | null;
  chronic_conditions: string | null;
  essential_vaccination_status: string | null;
  is_lost: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  show_emergency_contact: boolean;
  premium_enabled: boolean;
  advanced_summary: string | null;
  last_visit_summary: string | null;
  last_vaccination_summary: string | null;
};

export type EmergencyTokenRow = {
  animal_id: string;
  token_hash: string;
  status: "active" | "revoked" | "rotated";
  expires_at: string | null;
};

type EmergencyAccessLogInsert = {
  token_hash: string | null;
  animal_id: string | null;
  request_path: string;
  ip_hash: string | null;
  user_agent_hash: string | null;
  country: string | null;
  outcome: string;
  served_view: string | null;
  request_id: string | null;
};

export const resolveEmergencyToken = cache(async (rawToken: string) => {
  const token = normalizeEmergencyToken(rawToken);
  const tokenHash = hashEmergencyToken(token);

  const admin = supabaseAdmin();

  const query = admin
    .from("emergency_qr_tokens" as never)
    .select("animal_id, token_hash, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const { data, error } = (await query) as unknown as {
    data: EmergencyTokenRow | null;
    error: Error | null;
  };

  if (error) {
    throw error;
  }

  return {
    token,
    tokenHash,
    tokenPrefix: getEmergencyTokenPrefix(token),
    row: data ?? null,
  };
});

export async function getEmergencyProfileByAnimalId(animalId: string) {
  const admin = supabaseAdmin();

  const query = admin
    .from("animal_emergency_profiles" as never)
    .select(`
      animal_id,
      enabled,
      animal_name,
      species,
      breed,
      sex,
      weight_kg,
      blood_type,
      allergies,
      active_therapies,
      chronic_conditions,
      essential_vaccination_status,
      is_lost,
      emergency_contact_name,
      emergency_contact_phone,
      show_emergency_contact,
      premium_enabled,
      advanced_summary,
      last_visit_summary,
      last_vaccination_summary
    `)
    .eq("animal_id", animalId)
    .maybeSingle();

  const { data, error } = (await query) as unknown as {
    data: EmergencyProfile | null;
    error: Error | null;
  };

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function touchEmergencyToken(tokenHash: string) {
  const admin = supabaseAdmin();

  const rpc = admin.rpc as unknown as (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ error: Error | null }>;

  const { error } = await rpc("increment_emergency_token_access", {
    p_token_hash: tokenHash,
  });

  if (error) {
    console.error("touchEmergencyToken failed", error);
  }
}

export async function insertEmergencyAccessLog(input: {
  tokenHash: string | null;
  animalId: string | null;
  requestPath: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  outcome: string;
  servedView: string | null;
  requestId: string | null;
}) {
  const admin = supabaseAdmin();

  const payload: EmergencyAccessLogInsert = {
    token_hash: input.tokenHash,
    animal_id: input.animalId,
    request_path: input.requestPath,
    ip_hash: input.ip ? hashValue(input.ip) : null,
    user_agent_hash: input.userAgent ? hashValue(input.userAgent) : null,
    country: input.country,
    outcome: input.outcome,
    served_view: input.servedView,
    request_id: input.requestId,
  };

  const { error } = await admin
    .from("emergency_access_logs" as never)
    .insert(payload as never);

  if (error) {
    console.error("insertEmergencyAccessLog failed", error);
  }
}