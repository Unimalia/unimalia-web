import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL || "";
const password = process.env.E2E_PASSWORD || "";

test("Login + open Adotta", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD env vars");

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  const tabAccedi = page.getByRole("button", { name: /^Accedi$/i }).first();
  if (await tabAccedi.isVisible().catch(() => false)) {
    await tabAccedi.click().catch(() => {});
  }

  await page.locator('input[type="email"]').fill(email.trim());
  await page.locator('input[type="password"]').fill(password.trim());

  const authResponsePromise = page.waitForResponse(
    (res) => res.url().includes("/auth/v1/token") && res.request().method() === "POST",
    { timeout: 15000 }
  ).catch(() => null);

  await page.locator("form button[type='submit']").click();

  const authRes = await authResponsePromise;

  if (!authRes) {
    const emailValid = await page
      .locator('input[type="email"]')
      .evaluate((el: HTMLInputElement) => el.checkValidity?.() ?? true);
    const passValid = await page
      .locator('input[type="password"]')
      .evaluate((el: HTMLInputElement) => el.checkValidity?.() ?? true);

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

  if (status >= 400) {
    throw new Error(`Supabase auth FAIL (HTTP ${status}). Body: ${bodyText}`);
  }

  await page.waitForTimeout(500);

  const left = await page
    .waitForURL((u) => !/\/login/i.test(u.pathname), { timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!left) {
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