import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getEmergencyTokenPrefix,
  hashEmergencyToken,
  hashValue,
  normalizeEmergencyToken,
} from "@/lib/emergency/token";

export type EmergencyTokenRow = {
  id?: string;
  animal_id: string;
  public_token: string | null;
  token_hash: string;
  token_prefix: string;
  status: "active" | "revoked" | "rotated";
  expires_at: string | null;
  created_at?: string | null;
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
    .select("id, animal_id, public_token, token_hash, token_prefix, status, expires_at, created_at")
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
  try {
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
  } catch (error) {
    console.error("insertEmergencyAccessLog crashed", error);
  }
}