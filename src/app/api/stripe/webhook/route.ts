import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type Role =
  | "free"
  | "owner"
  | "veterinarian"
  | "groomer"
  | "petsitter"
  | "boarding"
  | "trainer";

type Interval = "monthly" | "yearly" | null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function roleFromPriceId(priceId: string | null | undefined): { role: Role; interval: Interval } {
  if (!priceId) return { role: "free", interval: null };

  switch (priceId) {
    case process.env.PRICE_OWNER_YEARLY:
      return { role: "owner", interval: "yearly" };

    case process.env.PRICE_VET_MONTHLY:
      return { role: "veterinarian", interval: "monthly" };
    case process.env.PRICE_VET_YEARLY:
      return { role: "veterinarian", interval: "yearly" };

    case process.env.PRICE_GROOMER_MONTHLY:
      return { role: "groomer", interval: "monthly" };
    case process.env.PRICE_GROOMER_YEARLY:
      return { role: "groomer", interval: "yearly" };

    case process.env.PRICE_PETSITTER_MONTHLY:
      return { role: "petsitter", interval: "monthly" };
    case process.env.PRICE_PETSITTER_YEARLY:
      return { role: "petsitter", interval: "yearly" };

    case process.env.PRICE_BOARDING_MONTHLY:
      return { role: "boarding", interval: "monthly" };
    case process.env.PRICE_BOARDING_YEARLY:
      return { role: "boarding", interval: "yearly" };

    case process.env.PRICE_TRAINER_MONTHLY:
      return { role: "trainer", interval: "monthly" };
    case process.env.PRICE_TRAINER_YEARLY:
      return { role: "trainer", interval: "yearly" };

    default:
      return { role: "free", interval: null };
  }
}

export async function POST(req: Request) {
  try {
    // 1) Leggi signature (se manca: debug locale)
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

    const rawBody = await req.text();

    // 2) Inizializza Stripe SOLO qui (build-safe)
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

    // 3) Verifica firma webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, requireEnv("STRIPE_WEBHOOK_SECRET"));
    } catch (err: any) {
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // 4) Ignora eventi non subscription.* (evita lavori inutili)
    const isSubEvent =
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted";

    if (!isSubEvent) {
      return new Response("OK", { status: 200 });
    }

    // 5) Inizializza Supabase SOLO per subscription.* (build-safe)
    const supabaseAdmin = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const sub = event.data.object as Stripe.Subscription;
    const subAny = sub as any;

    const userId = String(subAny?.metadata?.user_id ?? "");
    if (!userId) {
      // Se manca metadata sulla subscription, non possiamo scrivere sul DB
      return new Response("OK (missing user_id metadata)", { status: 200 });
    }

    // Idempotenza base
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("last_webhook_event_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.last_webhook_event_id === event.id) {
      return new Response("OK", { status: 200 });
    }

    const stripeCustomerId =
      typeof subAny.customer === "string" ? subAny.customer : subAny.customer?.id ?? null;

    const stripeSubscriptionId = subAny.id ?? null;

    const priceId = subAny.items?.data?.[0]?.price?.id as string | undefined;
    const { role, interval } = roleFromPriceId(priceId);

    const status = String(subAny.status ?? "incomplete");

    const currentPeriodEnd =
      typeof subAny.current_period_end === "number"
        ? new Date(subAny.current_period_end * 1000).toISOString()
        : null;

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          role,
          billing_interval: interval,
          status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: !!(subAny.cancel_at_period_end ?? false),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          last_webhook_event_id: event.id,
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
    return new Response(`Webhook handler error: ${err?.message ?? "unknown"}`, { status: 500 });
  }
}