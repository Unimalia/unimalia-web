import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: non impostiamo apiVersion qui perché i typings nel tuo progetto
// si aspettano una versione diversa (es. "2026-01-28.clover").
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Role =
  | "free"
  | "owner"
  | "veterinarian"
  | "groomer"
  | "petsitter"
  | "boarding"
  | "trainer";

type Interval = "monthly" | "yearly" | null;

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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    // 1) Se manca la firma, deve SEMPRE rispondere 400 (mai 500)
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

    const rawBody = await req.text();

    // 2) Verifica firma
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // 3) Supabase admin (lazy init)
    const supabaseAdmin = getSupabaseAdmin();

    // 4) Gestione eventi subscription
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;

      const userId = String((sub as any)?.metadata?.user_id ?? "");
      if (!userId) return new Response("Missing user_id in subscription metadata", { status: 200 });

      // Idempotenza base: se stesso event già processato, stop
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("last_webhook_event_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing?.last_webhook_event_id === event.id) {
        return new Response("OK", { status: 200 });
      }

      const stripeCustomerId =
        typeof (sub as any).customer === "string" ? (sub as any).customer : (sub as any).customer?.id ?? null;
      const stripeSubscriptionId = (sub as any).id ?? null;

      const priceId = (sub as any).items?.data?.[0]?.price?.id as string | undefined;
      const { role, interval } = roleFromPriceId(priceId);

      const status = String((sub as any).status ?? "incomplete");

      // Typings in alcune versioni non espongono current_period_end,
      // ma nel payload webhook c'è: lo leggiamo in modo sicuro.
      const subAny = sub as any;
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
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }
}