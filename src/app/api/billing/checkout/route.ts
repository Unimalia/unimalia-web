import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("Missing env: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecret);

type Role =
  | "owner"
  | "veterinarian"
  | "groomer"
  | "petsitter"
  | "boarding"
  | "trainer";

type Interval = "monthly" | "yearly";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getPriceId(role: Role, interval: Interval): string {
  if (role === "owner") {
    if (interval !== "yearly") throw new Error("OWNER_ONLY_YEARLY");
    return requireEnv("PRICE_OWNER_YEARLY");
  }

  if (role === "veterinarian") {
    return interval === "monthly"
      ? requireEnv("PRICE_VET_MONTHLY")
      : requireEnv("PRICE_VET_YEARLY");
  }

  if (role === "groomer") {
    return interval === "monthly"
      ? requireEnv("PRICE_GROOMER_MONTHLY")
      : requireEnv("PRICE_GROOMER_YEARLY");
  }

  if (role === "petsitter") {
    return interval === "monthly"
      ? requireEnv("PRICE_PETSITTER_MONTHLY")
      : requireEnv("PRICE_PETSITTER_YEARLY");
  }

  if (role === "boarding") {
    return interval === "monthly"
      ? requireEnv("PRICE_BOARDING_MONTHLY")
      : requireEnv("PRICE_BOARDING_YEARLY");
  }

  if (role === "trainer") {
    return interval === "monthly"
      ? requireEnv("PRICE_TRAINER_MONTHLY")
      : requireEnv("PRICE_TRAINER_YEARLY");
  }

  throw new Error("INVALID_ROLE");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body?.userId ?? "");
    const email = String(body?.email ?? "");
    const role = body?.role as Role;
    const interval = body?.interval as Interval;

    if (!userId || !email || !role || !interval) {
      return new Response("Missing fields", { status: 400 });
    }

    const appUrl = requireEnv("APP_URL");
    const priceId = getPriceId(role, interval);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      metadata: {
        user_id: userId,
        role,
        billing_interval: interval,
      },
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return new Response(`Checkout error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}