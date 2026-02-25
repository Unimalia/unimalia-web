import Stripe from "stripe";

export const runtime = "nodejs"; // importante su Vercel
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  let event: Stripe.Event;

  try {
    const body = await req.text(); // IMPORTANT: raw body
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err?.message ?? "Unknown error"}`, { status: 400 });
  }

  // TODO: qui gestisci gli eventi e scrivi su Supabase
  // Per ora confermiamo solo che arriva
  console.log("✅ Stripe webhook received:", event.type);

  return new Response("ok", { status: 200 });
}