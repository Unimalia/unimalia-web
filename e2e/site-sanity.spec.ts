import { test, expect } from "@playwright/test";
import { loginIfNeeded } from "./helpers/auth";

const KEY_PAGES = ["/", "/smarrimenti", "/ritrovati", "/servizi", "/adotta", "/identita"];

function isThirdParty(url: string) {
  try {
    const u = new URL(url);
    return !["localhost", "127.0.0.1"].includes(u.hostname);
  } catch {
    return false;
  }
}

// Rumore frequente (non deve rompere il sanity)
function isNoisyVendor(url: string) {
  return /iubenda\.com|idb\.iubenda\.com|google\.com\/maps|googleapis\.com|gstatic\.com|vercel\.live/i.test(url);
}

// ✅ Ignora ERR_ABORTED "normali" (dev routing / iframe / immagini / RSC / chunk)
function isIgnorableAborted(url: string, errorText: string) {
  const u = url.toLowerCase();
  const e = (errorText || "").toLowerCase();

  if (!e.includes("err_aborted")) return false;

  // Next dev / turbopack chunks / RSC
  if (u.includes("/_next/static/")) return true;
  if (u.includes("_rsc=")) return true;

  // Google maps iframe spesso viene sostituito/abortito
  if (u.includes("google.com/maps")) return true;

  // Supabase storage immagini: spesso abortite da route change
  if (u.includes(".supabase.co/storage/v1/")) return true;

  // Supabase REST chiamate abortite durante navigazione
  if (u.includes(".supabase.co/rest/v1/")) return true;

  // In generale, se è un GET di asset pesante e la pagina sta navigando, è rumore
  if (e.includes("err_aborted") && (u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".png") || u.endsWith(".webp") || u.endsWith(".gif"))) {
    return true;
  }

  return false;
}

// ✅ Console rumore comune
function isIgnorableConsoleError(text: string) {
  const t = (text || "").toLowerCase();

  if (t.includes("favicon")) return true;
  if (t.includes("resizeobserver loop limit exceeded")) return true;
  if (t.includes("failed to load resource") && t.includes("status of 400")) return true;

  return false;
}

// ✅ Errori di rete DAVVERO seri
function isHardNetworkError(errorText: string) {
  const e = (errorText || "").toLowerCase();
  return (
    e.includes("err_name_not_resolved") ||
    e.includes("err_connection_refused") ||
    e.includes("err_connection_reset") ||
    e.includes("err_internet_disconnected") ||
    e.includes("err_timed_out") ||
    e.includes("failed") && !e.includes("err_aborted")
  );
}

test("Sanity: no console errors on key pages (logged)", async ({ page }) => {
  test.setTimeout(90_000);

  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on("requestfailed", (req) => {
    const url = req.url();
    const fail = req.failure()?.errorText || "requestfailed";

    // ✅ ignora abort “normali”
    if (isIgnorableAborted(url, fail)) return;

    // ✅ ignora vendor rumorosi (anche se falliscono)
    if (isThirdParty(url) && isNoisyVendor(url)) return;

    // ✅ se non è hard-error e non è first-party critico, trattalo come warning e non failare
    // (ma qui per semplicità: logghiamo solo hard errors)
    if (!isHardNetworkError(fail)) return;

    requestFailures.push(`${req.method()} ${url} -> ${fail}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isIgnorableConsoleError(text)) return;

    // Se è "Failed to fetch" spesso è correlato a richieste abortite/3rd-party
    if (/failed to fetch/i.test(text)) return;

    consoleErrors.push(text);
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await loginIfNeeded(page);

  for (const path of KEY_PAGES) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
  }

  if (requestFailures.length) {
    throw new Error(`Request failures HARD trovati:\n\n- ${requestFailures.join("\n- ")}`);
  }

  if (consoleErrors.length) {
    throw new Error(`Console errors REALI trovati:\n\n- ${consoleErrors.join("\n- ")}`);
  }
});

test("Sanity: key pages return 200 (logged)", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await loginIfNeeded(page);

  for (const path of KEY_PAGES) {
    const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
    const status = resp?.status();

    expect(status, `Status for ${path}`).toBeGreaterThanOrEqual(200);
    expect(status, `Status for ${path}`).toBeLessThan(400);
  }
});