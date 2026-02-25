// e2e/login-and-adotta.spec.ts
import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL || "";
const password = process.env.E2E_PASSWORD || "";

test("Login + open Adotta", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD env vars");

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Se la pagina ha tab "Accedi / Registrati", assicura di essere su "Accedi"
  const tabAccedi = page.getByRole("button", { name: /^Accedi$/i }).first();
  if (await tabAccedi.isVisible().catch(() => false)) {
    await tabAccedi.click().catch(() => {});
  }

  await page.locator('input[type="email"]').fill(email.trim());
  await page.locator('input[type="password"]').fill(password.trim());

  // Intercetta la chiamata Supabase auth (signInWithPassword)
  const authResponsePromise = page.waitForResponse(
    (res) => res.url().includes("/auth/v1/token") && res.request().method() === "POST",
    { timeout: 15000 }
  ).catch(() => null);

  // Click submit robusto
  await page.locator("form button[type='submit']").click();

  const authRes = await authResponsePromise;

  // Se non c'è nessuna chiamata auth, il form non sta proprio invocando Supabase (selettori? submit? JS? overlay?)
  if (!authRes) {
    // prova a capire se il form ha mostrato errori HTML5 (required) o simili
    const emailValid = await page.locator('input[type="email"]').evaluate((el: any) => el.checkValidity?.() ?? true);
    const passValid = await page.locator('input[type="password"]').evaluate((el: any) => el.checkValidity?.() ?? true);
    throw new Error(
      `Nessuna chiamata a /auth/v1/token intercettata.\n` +
      `Validity email=${emailValid}, password=${passValid}.\n` +
      `Probabile: submit non parte / handler non eseguito / overlay blocca / selettore sbagliato.`
    );
  }

  const status = authRes.status();
  let bodyText = "";
  try {
    bodyText = await authRes.text();
  } catch {}

  // Se Supabase risponde errore, lo stampiamo chiarissimo
  if (status >= 400) {
    throw new Error(`Supabase auth FAIL (HTTP ${status}). Body: ${bodyText}`);
  }

  // Se ok, ora aspettiamo uscita da /login (o almeno un segno di sessione)
  await page.waitForTimeout(500);

  // tenta redirect
  const left = await page
    .waitForURL((u) => !/\/login/i.test(u.pathname), { timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!left) {
    // Check alternativo: esiste cookie Supabase?
    const cookies = await page.context().cookies();
    const hasSupabaseCookie = cookies.some((c) => c.name.startsWith("sb-"));
    if (!hasSupabaseCookie) {
      throw new Error(
        `Auth OK (HTTP ${status}) ma nessun redirect e nessun cookie sb-* trovato.\n` +
        `Forse stai usando storage diverso o redirect disabilitato.`
      );
    }
  }

  await page.goto("/adotta");
  await expect(page.locator("body")).toContainText(/Adotta/i);
});