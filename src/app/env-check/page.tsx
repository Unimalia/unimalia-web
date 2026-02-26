export const dynamic = "force-dynamic";

export default function EnvCheckPage() {
  const data = {
    // --- Vercel "System Environment Variables" (server-side) ---
    VERCEL_ENV: process.env.VERCEL_ENV ?? null, // production | preview | development
    VERCEL_URL: process.env.VERCEL_URL ?? null,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null, // branch
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null, // commit SHA
    VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID ?? null,

    // --- Runtime stamp (sempre diverso ad ogni request se non cache) ---
    RUNTIME_ISO: new Date().toISOString(),

    // --- Le tue env (OK) ---
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_SET: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  };

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Env check</h1>

      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Se <b>VERCEL_GIT_COMMIT_SHA</b> non coincide con <code>git log -1</code>, stai guardando il deployment sbagliato
        (o cache).
      </p>

      <pre style={{ marginTop: 16, background: "#f4f4f5", padding: 16, borderRadius: 12 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}