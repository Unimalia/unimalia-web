export const dynamic = "force-dynamic";

export default function EnvCheckPage() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>Env check</h1>
      <pre style={{ marginTop: 16, background: "#f4f4f5", padding: 16, borderRadius: 12 }}>
{JSON.stringify(
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_SET: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  null,
  2
)}
      </pre>
    </main>
  );
}
