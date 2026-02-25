export async function GET() {
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  const hasAppUrl = !!process.env.APP_URL;
  const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;

  return Response.json({
    hasStripeSecretKey: hasStripe,
    hasAppUrl,
    hasStripeWebhookSecret: hasWebhook,
    vercelEnv: process.env.VERCEL_ENV ?? null, // "production" | "preview" | "development"
  });
}