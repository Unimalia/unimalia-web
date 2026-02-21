// e2e/login-and-adotta.spec.ts
import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL || "";
const password = process.env.E2E_PASSWORD || "";

test("Login + open Adotta", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD env vars");

  await page.goto("/login");

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  await page.getByRole("button", { name: /Accedi/i }).click();

  // dopo login, proviamo ad aprire /adotta
  await page.goto("/adotta");
  await expect(page.getByRole("heading", { name: /Adotta/i })).toBeVisible();
});