"use client";

import { supabase } from "@/lib/supabaseClient";

export async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return {};
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}