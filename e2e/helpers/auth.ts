// e2e/helpers/auth.ts
import { expect, type Page } from "@playwright/test";

export async function loginIfNeeded(page: Page) {
  const email = process.env.E2E_EMAIL || "";
  const password = process.env.E2E_PASSWORD || "";

  if (!email || !password) {
    throw new Error("Missing E2E_EMAIL or E2E_PASSWORD env vars");
  }

  await page.goto("/login");

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // ✅ submit del form
  await page.locator("form").getByRole("button", { name: /^Accedi$/i }).click();

  await expect(page).not.toHaveURL(/\/login/i);
}