"use client";

import { supabase } from "@/lib/supabaseClient";

export async function authHeaders(): Promise<Record<string, string>> {
  const sessionResp = await supabase.auth.getSession();
  const session = sessionResp.data.session;

  if (session?.access_token) {
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  const userResp = await supabase.auth.getUser();

  if (userResp.error || !userResp.data.user) {
    console.warn("[AUTH HEADERS] no authenticated user");
    return {};
  }

  const refreshed = await supabase.auth.refreshSession();

  if (refreshed.error || !refreshed.data.session?.access_token) {
    console.warn("[AUTH HEADERS] unable to refresh access token", refreshed.error);
    return {};
  }

  return {
    Authorization: `Bearer ${refreshed.data.session.access_token}`,
  };
}