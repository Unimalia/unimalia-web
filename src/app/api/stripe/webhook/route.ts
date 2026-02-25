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
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

async function upsertSubscriptionFromStripe(subscriptionId: string) {
  const res = await stripe.subscriptions.retrieve(subscriptionId);
  const sub = ("data" in res ? res.data : res) as Stripe.Subscription;

  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.log("⚠️ Missing metadata.user_id on subscription", { subscriptionId });
    return;
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  // ✅ safe read (tipi Stripe non espongono current_period_end nella tua versione)
  const cpe = (sub as any).current_period_end as number | undefined;

  const payload = {
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: sub.id,
    status: sub.status ?? null,
    role: sub.metadata?.role ?? null,
    billing_interval: sub.metadata?.billing_interval ?? null,
    current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.log("❌ Supabase upsert error", error);
  } else {
    console.log("✅ Supabase upsert OK", {
      user_id: userId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: payload.current_period_end,
    });
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  let event: Stripe.Event;

  try {
    const body = await req.text(); // raw body
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
        const subId = session.subscription ? String(session.subscription) : null;

        console.log("checkout.session.completed", {
          id: session.id,
          mode: (session as any).mode,
          subscription: subId,
          customer: session.customer,
          metadata: session.metadata,
        });

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