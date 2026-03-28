import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Supabase client SERVER con sessione utente (RLS attiva)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In alcuni contesti server di Next.js il set dei cookie
          // può non essere consentito. Manteniamo il comportamento
          // conservativo per non rompere i flussi esistenti.
        }
      },
    },
  });
}

/**
 * Alias compatibilità
 */
export const createClient = createServerSupabaseClient;

/**
 * Admin Supabase client (SERVICE ROLE)
 * ⚠️ Bypassa RLS: usarlo solo lato server in flussi controllati.
 */
export function supabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  adminClient = createSupabaseJsClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}