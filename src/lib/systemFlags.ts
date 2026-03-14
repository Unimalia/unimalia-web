import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CoreSystemFlags = {
  emergency_mode: boolean;
  maintenance_mode: boolean;
  public_registration_enabled: boolean;
  professional_registration_enabled: boolean;
  lost_found_enabled: boolean;
  public_search_enabled: boolean;
  consults_enabled: boolean;
  owner_access_requests_enabled: boolean;
};

const DEFAULT_FLAGS: CoreSystemFlags = {
  emergency_mode: false,
  maintenance_mode: false,
  public_registration_enabled: false,
  professional_registration_enabled: false,
  lost_found_enabled: false,
  public_search_enabled: false,
  consults_enabled: false,
  owner_access_requests_enabled: false,
};

export async function getCoreSystemFlags(): Promise<CoreSystemFlags> {
  try {
    const admin = supabaseAdmin();

    const { data, error } = await admin
      .from("system_settings")
      .select("value_json")
      .eq("key", "core")
      .maybeSingle();

    if (error || !data?.value_json || typeof data.value_json !== "object") {
      return DEFAULT_FLAGS;
    }

    const raw = data.value_json as Record<string, unknown>;

    return {
      emergency_mode: raw.emergency_mode === true,
      maintenance_mode: raw.maintenance_mode === true,
      public_registration_enabled: raw.public_registration_enabled === true,
      professional_registration_enabled: raw.professional_registration_enabled === true,
      lost_found_enabled: raw.lost_found_enabled === true,
      public_search_enabled: raw.public_search_enabled === true,
      consults_enabled: raw.consults_enabled === true,
      owner_access_requests_enabled: raw.owner_access_requests_enabled === true,
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export async function isFlagEnabled(flag: keyof CoreSystemFlags): Promise<boolean> {
  const flags = await getCoreSystemFlags();
  return flags[flag] === true;
}
