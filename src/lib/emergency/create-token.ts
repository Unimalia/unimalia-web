import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  generateEmergencyToken,
  getEmergencyTokenPrefix,
  hashEmergencyToken,
} from "@/lib/emergency/token";

type EmergencyQrTokenInsert = {
  animal_id: string;
  token_hash: string;
  token_prefix: string;
  status: "active" | "revoked" | "rotated";
};

export async function createEmergencyQrToken(animalId: string) {
  const token = generateEmergencyToken();
  const tokenHash = hashEmergencyToken(token);
  const tokenPrefix = getEmergencyTokenPrefix(token);

  const admin = supabaseAdmin();

  const payload: EmergencyQrTokenInsert = {
    animal_id: animalId,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    status: "active",
  };

  const { error } = await (admin
    .from("emergency_qr_tokens" as never)
    .insert(payload as never));

  if (error) {
    throw error;
  }

  return {
    token,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${token}`,
  };
}