// scripts/gen-anfi-cat-breeds-sql.mjs
// Genera breeds-cats.sql (species='cat') a partire dal PDF ANFI (FIFe) "Allegato C - Elenco razze"
// Fonte: https://www.anfitalia.it/.../Allegato-C---Elenco-razze-e-suddivisione-in-categorie.pdf

import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";

const PDF_URL =
  "https://www.anfitalia.it/files/143/Norme-Tecniche-del-LOI/329/Allegato-C---Elenco-razze-e-suddivisione-in-categorie.pdf";
const OUT_FILE = "breeds-cats.sql";

function escapeSql(str) {
  return str.replace(/'/g, "''").trim();
}

async function downloadPdf(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download PDF failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
}

// Heuristica robusta:
// Nel PDF ci sono righe tipo: "MCO Maine Coon" oppure "PER Persiano"
// Prendiamo "nome razza" (parte testuale) e scartiamo codici EMS e header.
function extractCatBreedNames(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const names = new Set();

  for (const line of lines) {
    // Salta intestazioni note
    const up = line.toUpperCase();
    if (
      up.includes("ALLEGATO") ||
      up.includes("ELENCO RAZZE") ||
      up.includes("SUDDIVISIONE") ||
      up.includes("CATEGORIA") ||
      up.includes("CODICE") ||
      up.includes("NOME DI RAZZA") ||
      up.includes("STANDARD") ||
      up.includes("FIFE")
    ) {
      continue;
    }

    // pattern comune: "ABC Nome Razza" (EMS di 3 lettere)
    // Alcune hanno 2-4 lettere; prendiamo 2-4 maiuscole iniziali + spazio + testo
    const m = line.match(/^([A-Z]{2,4})\s+(.+)$/);
    if (!m) continue;

    let name = m[2].trim();

    // Scarta righe che sono chiaramente note/colonne
    if (name.length < 2) continue;

    // Taglia eventuale parte inglese o extra dopo doppio spazio/colonne
    // (nel PDF può capitare che ci sia anche nome inglese o note)
    name = name.split("  ")[0].trim();

    // Pulizia simboli strani
    name = name.replace(/[•★]+/g, "").trim();

    // Ulteriore filtro: se sembra ancora un codice
    if (/^[A-Z]{2,4}$/.test(name)) continue;

    names.add(name);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "it"));
}

async function main() {
  const tmpDir = path.join(process.cwd(), ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const pdfPath = path.join(tmpDir, "anfi_allegato_c_razze.pdf");
  await downloadPdf(PDF_URL, pdfPath);

  const dataBuffer = fs.readFileSync(pdfPath);
  const parsed = await pdf(dataBuffer);

  const breeds = extractCatBreedNames(parsed.text);

  // FIFe riconosce decine di razze: se ne estraiamo troppo poche, fermiamo per sicurezza
  if (breeds.length < 20) {
    throw new Error(
      `Parsing troppo basso (${breeds.length}). Il PDF potrebbe essere cambiato: controlla .tmp e aggiorna la regex.`,
    );
  }

  const lines = [];
  lines.push("-- AUTOGENERATO: breeds-cats.sql (ANFI/FIFe - elenco razze)");
  lines.push(`-- Fonte: ${PDF_URL}`);
  lines.push("begin;");
  lines.push("insert into public.breeds (species, name)");
  lines.push("values");

  for (let i = 0; i < breeds.length; i++) {
    const n = escapeSql(breeds[i]);
    const comma = i === breeds.length - 1 ? ";" : ",";
    lines.push(`('cat','${n}')${comma}`);
  }

  lines.push("on conflict (species, name) do nothing;");
  lines.push("commit;");

  fs.writeFileSync(path.join(process.cwd(), OUT_FILE), lines.join("\n") + "\n", "utf8");

  console.log(`OK: generato ${OUT_FILE} con ${breeds.length} razze gatto (italiano)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});