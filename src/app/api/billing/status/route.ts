// app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SubscriptionRow = {
  user_id: string;
  status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  role: string | null;
  billing_interval: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  last_webhook_event_id: string | null;
};

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase env. Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token." }, { status: 401 });
    }

    // 1) Verifica utente dal token (anon key)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);

    if (userErr || !userData.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = userData.user.id;

    // 2) Query DB con service role (bypass RLS per lettura certa)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id,status,stripe_customer_id,stripe_subscription_id,role,billing_interval,current_period_end,trial_end,last_webhook_event_id",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sub = (data ?? null) as SubscriptionRow | null;

    return NextResponse.json({
      user_id: userId,
      subscription: sub,
      premium: sub?.status === "active" || sub?.status === "trialing",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}