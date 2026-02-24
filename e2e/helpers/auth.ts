import { expect, Page } from "@playwright/test";

async function dismissCookieBannerIfAny(page: Page) {
  const buttons = [
    page.getByRole("button", { name: /rifiuta/i }),
    page.getByRole("button", { name: /accetta/i }),
    page.getByRole("button", { name: /^ok$/i }),
    page.getByRole("button", { name: /chiudi/i }),
  ];

  for (const b of buttons) {
    if (await b.first().isVisible().catch(() => false)) {
      await b.first().click({ timeout: 2000 }).catch(() => {});
      return;
    }
  }
}

function norm(s: string) {
  return (s ?? "").trim();
}

async function isLoggedUI(page: Page, email: string) {
  // ✅ segnali di login
  const logoutLink = page.getByRole("link", { name: /esci/i }).first();
  const logoutBtn = page.getByRole("button", { name: /esci/i }).first();
  const emailText = page.getByText(email, { exact: false }).first();
  const profileName = page.getByText(/valentino panella/i).first(); // se vuoi, mettilo generico

  const checks = [
    logoutLink.isVisible().catch(() => false),
    logoutBtn.isVisible().catch(() => false),
    emailText.isVisible().catch(() => false),
    profileName.isVisible().catch(() => false),
  ];

  const results = await Promise.all(checks);
  return results.some(Boolean);
}

export async function loginIfNeeded(page: Page) {
  const email = norm(process.env.E2E_EMAIL || "");
  const password = norm(process.env.E2E_PASSWORD || "");

  if (!email || !password) {
    throw new Error("E2E_EMAIL o E2E_PASSWORD mancanti. Mettili in .env.");
  }

  // Se già loggato nella pagina corrente, stop
  if (await isLoggedUI(page, email)) return;

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await dismissCookieBannerIfAny(page);

  const emailInput = page.locator('input[type="email"]');
  const passInput = page.locator('input[type="password"]');
  const submitBtn = page.locator("form button[type='submit'], button[type='submit']").first();

  await expect(emailInput).toBeVisible();
  await expect(passInput).toBeVisible();
  await expect(submitBtn).toBeVisible();

  await emailInput.fill(email);
  await passInput.fill(password);

  // HTML5 validity (evita submit che non parte)
  const emailValid = await emailInput.evaluate((el: any) => el.checkValidity?.() ?? true);
  if (!emailValid) {
    throw new Error(`Email non valida per HTML5: ${JSON.stringify(email)} (spazi o caratteri strani?)`);
  }

  let tokenStatus: number | null = null;
  const tokenWatcher = page
    .waitForResponse((r) => r.url().includes("/auth/v1/token"), { timeout: 15000 })
    .then((r) => (tokenStatus = r.status()))
    .catch(() => {});

  await submitBtn.click();

  // aspetta token o UI loggata
  await Promise.race([
    tokenWatcher,
    page.getByRole("link", { name: /esci/i }).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    page.getByRole("button", { name: /esci/i }).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    page.getByText(email, { exact: false }).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
  ]);

  // lascia tempo al client di aggiornare sessione/UI
  await page.waitForTimeout(1200);

  const ok = await isLoggedUI(page, email);
  if (!ok) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `Login non confermato su ${page.url()}\n` +
        `Chiamata /auth/v1/token: ${tokenStatus === null ? "NON intercettata" : "HTTP " + tokenStatus}\n\n` +
        `Testo pagina (estratto):\n${bodyText.slice(0, 1200)}`
    );
  }
}