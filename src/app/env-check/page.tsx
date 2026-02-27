// src/app/env-check/page.tsx
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

function isAuthorized(searchParams: Record<string, string | string[] | undefined>) {
  const expected = process.env.ENV_CHECK_TOKEN;
  if (!expected) return false;

  const token = searchParams?.token;
  if (typeof token === "string" && token.length > 0) return token === expected;

  return false;
}

export default function EnvCheckPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // 🔒 Hard gate
  if (!isAuthorized(searchParams)) {
    notFound();
  }

  // ✅ Mostriamo solo il minimo indispensabile
  const data = {
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    RUNTIME_ISO: new Date().toISOString(),
  };

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Env check</h1>

      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Se <b>VERCEL_GIT_COMMIT_SHA</b> non coincide con <code>git log -1</code>, stai guardando il deployment sbagliato.
      </p>

      <pre style={{ marginTop: 16, background: "#f4f4f5", padding: 16, borderRadius: 12 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}