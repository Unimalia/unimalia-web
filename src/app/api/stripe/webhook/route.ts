import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Stripe server instance
const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2026-01-28.clover",
});

// Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// --------------------------------------------------
// Stripe customer ↔ user mapping
// --------------------------------------------------

async function upsertCustomerMapping(userId: string, customerId: string) {
  const { error } = await supabase
    .from("stripe_customers")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.log("❌ Supabase upsert stripe_customers error", error);
  } else {
    console.log("✅ stripe_customers upsert OK", { userId, customerId });
  }
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.log("❌ Supabase select stripe_customers error", error);
    return null;
  }

  return data?.user_id ?? null;
}

// --------------------------------------------------
// Subscription upsert
// --------------------------------------------------

async function upsertSubscriptionFromStripe(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  if (!customerId) {
    console.log("⚠️ Missing customerId on subscription", { subscriptionId });
    return;
  }

  // userId: metadata oppure mapping
  let userId: string | null = sub.metadata?.user_id ?? null;

  if (!userId) {
    userId = await getUserIdByCustomer(customerId);
  }

  if (!userId) {
    console.log("⚠️ Missing userId (no metadata + no mapping)", {
      subscriptionId,
      customerId,
    });
    return;
  }

  // ✅ Evita null nei campi che Supabase tipizza come string NOT NULL
  const role = sub.metadata?.role ? String(sub.metadata.role) : "";
  const billingInterval = sub.metadata?.billing_interval
    ? String(sub.metadata.billing_interval)
    : "";

  const payload = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: String(sub.status), // sempre string
    role, // sempre string
    billing_interval: billingInterval, // sempre string
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.log("❌ Supabase upsert subscriptions error", error);
  } else {
    console.log("✅ subscriptions upsert OK", {
      user_id: userId,
      stripe_subscription_id: sub.id,
      status: sub.status,
    });
  }
}

// --------------------------------------------------
// Webhook handler
// --------------------------------------------------

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err?.message ?? "Unknown error"}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id ?? null;
        const customerId = session.customer ? String(session.customer) : null;
        const subId = session.subscription ? String(session.subscription) : null;

        console.log("checkout.session.completed", { userId, customerId, subId });

        if (userId && customerId) await upsertCustomerMapping(userId, customerId);

        if (subId) await upsertSubscriptionFromStripe(subId);

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        console.log(event.type, { id: sub.id, status: (sub as any).status });

        await upsertSubscriptionFromStripe(sub.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }
  } catch (e: any) {
    console.log("❌ Webhook handler error:", e?.message ?? e);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}