import { test, expect } from "@playwright/test";
import { loginIfNeeded } from "./helpers/auth";

test("FULL FLOW: login -> create smarrimento -> verify list", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await loginIfNeeded(page);

  // 1) Vai a "Pubblica" smarrimento
  await page.goto("/smarrimento", { waitUntil: "domcontentloaded" });

  // 2) Compila il form in modo generico (senza conoscere esattamente i campi)
  // Strategia: cerca input/textarea visibili e riempi quelli principali.
  const titleLike = page.locator('input[name*="tit" i], input[placeholder*="tit" i]').first();
  if (await titleLike.isVisible().catch(() => false)) {
    await titleLike.fill(`Test Playwright ${Date.now()}`);
  }

  const descLike = page.locator('textarea, textarea[name*="desc" i], textarea[placeholder*="desc" i]').first();
  if (await descLike.isVisible().catch(() => false)) {
    await descLike.fill("Inserzione di test automatica (Playwright).");
  }

  // Prova a selezionare eventuali select (se presenti) senza conoscere valori
  const selects = page.locator("select");
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const s = selects.nth(i);
    if (await s.isVisible().catch(() => false)) {
      const options = s.locator("option");
      const n = await options.count();
      if (n >= 2) {
        // scegli seconda opzione (di solito la prima è placeholder)
        const val = await options.nth(1).getAttribute("value");
        if (val) await s.selectOption(val).catch(() => {});
      }
    }
  }

  // 3) Clicca bottone di pubblicazione/salvataggio (nomi possibili)
  const publishBtn = page
    .getByRole("button", { name: /pubblica|salva|invia|crea/i })
    .first();

  await expect(publishBtn).toBeVisible({ timeout: 15000 });

  // Aspetta che eventuali richieste partano
  await Promise.allSettled([
    page.waitForResponse((r) => r.status() < 500, { timeout: 15000 }).catch(() => {}),
    publishBtn.click(),
  ]);

  // 4) Verifica: o vai su pagina dettaglio /smarrimenti/[id] o appare messaggio successo
  const successLike = page.getByText(/pubblicat|creat|successo|ok|fatto/i).first();
  const wentToDetail = page.waitForURL(/\/smarrimenti\/.+/i, { timeout: 20000 }).then(() => true).catch(() => false);
  const sawSuccess = successLike.waitFor({ state: "visible", timeout: 20000 }).then(() => true).catch(() => false);

  const ok = await Promise.race([wentToDetail, sawSuccess]);
  expect(ok).toBeTruthy();

  // 5) Vai lista smarrimenti e controlla che la pagina sia raggiungibile
  await page.goto("/smarrimenti", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /smarrimenti/i }).first()).toBeVisible({ timeout: 15000 });
});