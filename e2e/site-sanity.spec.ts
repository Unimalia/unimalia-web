// e2e/site-sanity.spec.ts
import { test, expect } from "@playwright/test";
import { loginIfNeeded } from "./helpers/auth";

test("Sanity: no console errors on key pages (logged)", async ({ page }) => {
  await loginIfNeeded(page);

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const pages = ["/", "/profilo", "/smarrimenti", "/smarrimenti/nuovo", "/adotta"];

  for (const p of pages) {
    await page.goto(p);
    await expect(page).not.toHaveURL(/\/login/i);
    await page.waitForLoadState("networkidle");
  }

  // tolleranza: puoi anche filtrare errori noti in futuro
  expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});

test("Sanity: key pages return 200 (logged)", async ({ page }) => {
  await loginIfNeeded(page);

  const urls = ["/", "/profilo", "/smarrimenti", "/smarrimenti/nuovo", "/adotta"];

  for (const u of urls) {
    const res = await page.goto(u);
    expect(res, `No response for ${u}`).not.toBeNull();
    expect(res!.status(), `Bad status for ${u}`).toBeLessThan(400);
  }
});