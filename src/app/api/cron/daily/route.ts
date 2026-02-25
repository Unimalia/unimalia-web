import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: non crashare la build a import-time
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getSupabaseAdmin() {
  // ✅ tutto dentro una funzione: non viene eseguito durante build/import
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// Se usi Vercel Cron, puoi proteggere l'endpoint con un segreto
function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // se non lo usi, non blocchiamo
  const got = req.headers.get("x-cron-secret");
  return got === expected;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // ✅ TODO: metti qui la tua logica giornaliera
    // Esempi possibili:
    // - pulizia vecchi record
    // - aggiornare stati abbonamenti
    // - inviare notifiche
    //
    // ESEMPIO placeholder (non fa nulla):
    const now = new Date().toISOString();

    return Response.json({ ok: true, ranAt: now });
  } catch (e: any) {
    console.log("❌ /api/cron/daily error:", e?.message ?? e);
    // ✅ 500 runtime, ma NON rompe build/deploy
    return new Response(`Cron error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}