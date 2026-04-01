import { test, expect } from "@playwright/test";

// TODO: creare fixture per utenti test
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || "";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "";
const PROFESSIONAL_EMAIL = process.env.E2E_PROFESSIONAL_EMAIL || "";
const PROFESSIONAL_PASSWORD = process.env.E2E_PROFESSIONAL_PASSWORD || "";

test.describe("UNIMALIA Core E2E - Pre-Produzione", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: setup dati di test puliti
  });

  test("1. Autenticazione Multi-ruolo", async ({ page }) => {
    // Precondizioni: Utenti test owner e professionista esistenti
    
    // Test login owner
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(OWNER_EMAIL);
    await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: verificare redirect a dashboard owner
    await expect(page).toHaveURL(/\/(owner|dashboard)/);
    
    // Logout
    // TODO: implementare logout
    
    // Test login professionista
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: verificare redirect a dashboard professionista
    await expect(page).toHaveURL(/\/professionisti/);
  });

  test("2. Creazione Animale", async ({ page }) => {
    // Precondizioni: Owner autenticato
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(OWNER_EMAIL);
    await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    await page.goto("/identita");
    
    // TODO: compilare form animale
    // await page.locator('[data-testid="animal-name"]').fill("Test Animal");
    // await page.locator('[data-testid="animal-species"]').selectOption("dog");
    // await page.locator('[data-testid="animal-breed"]').fill("Test Breed");
    
    // TODO: cliccare crea animale
    // await page.locator('[data-testid="create-animal"]').click();
    
    // TODO: verificare QR code generato
    // await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // TODO: verificare animale in dashboard
  });

  test("3. Claim Owner", async ({ page }) => {
    // Precondizioni: Animale esistente non claimed, owner autenticato
    // TODO: creare animale di test senza owner
    
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(OWNER_EMAIL);
    await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a claim con token
    // await page.goto(`/claim/[TEST_TOKEN]`);
    
    // TODO: inserire email e confermare
    // await page.locator('[data-testid="claim-email"]').fill(OWNER_EMAIL);
    // await page.locator('[data-testid="confirm-claim"]').click();
    
    // TODO: verificare claim successo
  });

  test("4. Access Request", async ({ page }) => {
    // Precondizioni: Professionista autenticato, animale con owner
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    await page.goto("/richiedi-consulto");
    
    // TODO: cercare animale
    // await page.locator('[data-testid="animal-search"]').fill("Test Animal");
    // await page.locator('[data-testid="search-button"]').click();
    
    // TODO: selezionare animale e inviare richiesta
    // await page.locator('[data-testid="request-access"]').click();
    // await page.locator('[data-testid="send-request"]').click();
    
    // TODO: verificare conferma richiesta inviata
  });

  test("5. Owner Approve", async ({ page }) => {
    // Precondizioni: Richiesta grant pendente, owner autenticato
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(OWNER_EMAIL);
    await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a gestione annunci
    // await page.goto("/gestisci-annuncio/[REQUEST_ID]");
    
    // TODO: approvare richiesta
    // await page.locator('[data-testid="approve-grant"]').click();
    // await page.locator('[data-testid="confirm-approve"]').click();
    
    // TODO: verificare grant attivato
  });

  test("6. Grant Check", async ({ page }) => {
    // Precondizioni: Grant attivo, professionista autenticato
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    await page.goto("/professionisti/dashboard");
    
    // TODO: verificare visibilità animale con grant
    // await expect(page.locator('[data-testid="animal-with-grant"]')).toBeVisible();
    
    // TODO: verificare stato grant
    // await expect(page.locator('[data-testid="grant-status"]')).toContainText("attivo");
  });

  test("7. Lettura Animale Professionista", async ({ page }) => {
    // Precondizioni: Grant attivo, professionista autenticato
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a scheda animale
    // await page.goto("/animali/[ANIMAL_ID]");
    
    // TODO: verificare dati animali visibili
    // await expect(page.locator('[data-testid="animal-details"]')).toBeVisible();
    
    // TODO: verificare accesso storia clinica
    // await expect(page.locator('[data-testid="clinical-history"]')).toBeVisible();
  });

  test("8. Creazione Evento Clinico", async ({ page }) => {
    // Precondizioni: Grant attivo, professionista autenticato
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a creazione evento
    // await page.goto("/professionisti/animale/[ANIMAL_ID]/evento");
    
    // TODO: compilare form evento clinico
    // await page.locator('[data-testid="event-title"]').fill("Visita di controllo");
    // await page.locator('[data-testid="event-description"]').fill("Esame generale");
    // await page.locator('[data-testid="event-date"]').fill("2026-01-01");
    
    // TODO: salvare evento
    // await page.locator('[data-testid="save-event"]').click();
    
    // TODO: verificare evento creato
  });

  test("9. Animal History", async ({ page }) => {
    // Precondizioni: Evento clinico esistente, grant attivo
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a storia clinica
    // await page.goto("/animali/[ANIMAL_ID]/storia");
    
    // TODO: verificare eventi visibili
    // await expect(page.locator('[data-testid="clinical-events"]')).toBeVisible();
    
    // TODO: verificare ordinamento per data
    // await expect(page.locator('[data-testid="event-item"]').first()).toContainText("2026-01-01");
  });

  test("10. Imaging Upload", async ({ page }) => {
    // Precondizioni: Grant attivo, professionista autenticato, file test
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a upload imaging
    // Route da confermare: forse /professionisti/animale/[ID]/imaging
    // await page.goto("/professionisti/animale/[ANIMAL_ID]/imaging");
    
    // TODO: selezionare file DICOM
    // await page.locator('[data-testid="file-input"]').setInputFiles("test-files/sample.dcm");
    
    // TODO: avviare upload
    // await page.locator('[data-testid="upload-button"]').click();
    
    // TODO: verificare upload completato
    // await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });

  test("11. Revoke Grant", async ({ page }) => {
    // Precondizioni: Grant attivo, owner autenticato
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(OWNER_EMAIL);
    await page.locator('input[type="password"]').fill(OWNER_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: navigare a gestione grant
    // await page.goto("/gestisci-annuncio/[GRANT_ID]");
    
    // TODO: revocare grant
    // await page.locator('[data-testid="revoke-grant"]').click();
    // await page.locator('[data-testid="confirm-revoke"]').click();
    
    // TODO: verificare grant revocato
    // await expect(page.locator('[data-testid="grant-revoked"]')).toBeVisible();
  });

  test("12. Fallback Own History", async ({ page }) => {
    // Precondizioni: Grant revocato, professionista autenticato
    await page.goto("/professionisti/login");
    await page.locator('input[type="email"]').fill(PROFESSIONAL_EMAIL);
    await page.locator('input[type="password"]').fill(PROFESSIONAL_PASSWORD);
    await page.locator("form button[type='submit']").click();
    
    // TODO: tentare accesso animale revocato
    // await page.goto("/animali/[ANIMAL_ID]");
    
    // TODO: verificare accesso negato
    // await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    
    // TODO: verificare visibili solo eventi propri
    // await page.goto("/professionisti/dashboard");
    // await expect(page.locator('[data-testid="own-events"]')).toBeVisible();
    // await expect(page.locator('[data-testid="revoked-animal"]')).not.toBeVisible();
  });
});
