export async function GET() {
  return Response.json({
    hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeSecretKeyLength: process.env.STRIPE_SECRET_KEY?.length ?? 0, // non mostra il valore
    hasAppUrl: !!process.env.APP_URL,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    vercelEnv: process.env.VERCEL_ENV ?? null, // production/preview/development
  });
}