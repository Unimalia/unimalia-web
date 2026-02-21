// e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("Smoke: home opens", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/UNIMALIA/i);
});

test("Smoke: adotta requires login or shows content", async ({ page }) => {
  await page.goto("/adotta");
  // accetta entrambe le situazioni:
  // - non loggato: compare "Accedi"
  // - loggato: compare "Adotta"
  const hasAccedi = await page.getByRole("link", { name: /Accedi/i }).isVisible().catch(() => false);
  const hasAdotta = await page.getByRole("heading", { name: /Adotta/i }).isVisible().catch(() => false);
  expect(hasAccedi || hasAdotta).toBeTruthy();
});