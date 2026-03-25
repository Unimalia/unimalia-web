"use client";

import { supabase } from "@/lib/supabaseClient";

export async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    console.warn("[AUTH] no user", error);
    return {};
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    console.warn("[AUTH] missing token");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}