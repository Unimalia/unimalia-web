import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2026-01-28.clover",
});

const supabase = createClient(
  process.env.SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

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
    console.error("stripe_customers upsert error");
  }
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error("stripe_customers select error");
    return null;
  }

  return data?.user_id ?? null;
}

async function upsertSubscriptionFromStripe(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  if (!customerId) {
    console.error("subscription missing customer");
    return;
  }

  let userId: string | null = sub.metadata?.user_id ?? null;

  if (!userId) {
    userId = await getUserIdByCustomer(customerId);
  }

  if (!userId) {
    console.error("subscription missing user mapping");
    return;
  }

  const role = sub.metadata?.role ? String(sub.metadata.role) : "";
  const billingInterval = sub.metadata?.billing_interval
    ? String(sub.metadata.billing_interval)
    : "";

  const payload = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: String(sub.status),
    role,
    billing_interval: billingInterval,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("subscriptions upsert error");
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Bad request", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("missing stripe webhook secret");
    return new Response("Server error", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id ?? null;
        const customerId = session.customer ? String(session.customer) : null;
        const subId = session.subscription ? String(session.subscription) : null;

        if (userId && customerId) {
          await upsertCustomerMapping(userId, customerId);
        }

        if (subId) {
          await upsertSubscriptionFromStripe(subId);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(sub.id);
        break;
      }

      default:
        break;
    }
  } catch {
    console.error("stripe webhook handler error");
    return new Response("Server error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
