import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SyncResult =
  | {
      ok: true;
      professionalId: string;
      authUserId: string;
      isProfessional: boolean;
      isVet: boolean;
    }
  | {
      ok: false;
      error: string;
    };

export async function syncProfessionalAuth(professionalId: string): Promise<SyncResult> {
  const admin = supabaseAdmin();

  const { data: professional, error: professionalError } = await admin
    .from("professionals")
    .select("id, owner_id, approved, is_vet")
    .eq("id", professionalId)
    .single();

  if (professionalError || !professional) {
    return {
      ok: false,
      error: professionalError?.message || "Professionista non trovato",
    };
  }

  const authUserId = String(professional.owner_id || "").trim();

  if (!authUserId) {
    return {
      ok: false,
      error: "owner_id mancante sul professionista: impossibile sincronizzare Auth",
    };
  }

  const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(authUserId);

  if (authReadError || !authData?.user) {
    return {
      ok: false,
      error: authReadError?.message || "Utente Auth non trovato",
    };
  }

  const isProfessional = professional.approved === true;
  const isVet = professional.approved === true && professional.is_vet === true;

  const currentAppMetadata =
    authData.user.app_metadata && typeof authData.user.app_metadata === "object"
      ? authData.user.app_metadata
      : {};

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: {
      ...currentAppMetadata,
      is_professional: isProfessional,
      is_vet: isVet,
    },
  });

  if (authUpdateError) {
    return {
      ok: false,
      error: authUpdateError.message,
    };
  }

  return {
    ok: true,
    professionalId,
    authUserId,
    isProfessional,
    isVet,
  };
}