import "server-only";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role =
  | "owner"
  | "veterinarian"
  | "groomer"
  | "petsitter"
  | "boarding"
  | "trainer";

type Interval = "monthly" | "yearly";

const ALLOWED_ROLES: Role[] = [
  "owner",
  "veterinarian",
  "groomer",
  "petsitter",
  "boarding",
  "trainer",
];

const ALLOWED_INTERVALS: Interval[] = ["monthly", "yearly"];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ALLOWED_ROLES.includes(value as Role);
}

function isInterval(value: unknown): value is Interval {
  return (
    typeof value === "string" &&
    ALLOWED_INTERVALS.includes(value as Interval)
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
    const appUrl = requireEnv("APP_URL");

    const body = await req.json().catch(() => null);

    const userId =
      typeof body?.userId === "string" ? body.userId.trim() : "";
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const role = body?.role;
    const interval = body?.interval;

    if (!userId || !email || !isRole(role) || !isInterval(interval)) {
      return new Response("Bad request", { status: 400 });
    }

    if (!isValidEmail(email)) {
      return new Response("Bad request", { status: 400 });
    }

    const priceId = getPriceId(role, interval);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      subscription_data: {
        metadata: {
          user_id: userId,
          role,
          billing_interval: interval,
        },
      },
      metadata: {
        user_id: userId,
        role,
        billing_interval: interval,
      },
    });

    if (!session.url) {
      return new Response("Server error", { status: 500 });
    }

    return Response.json({ url: session.url }, { status: 200 });
  } catch {
    return new Response("Server error", { status: 500 });
  }
}