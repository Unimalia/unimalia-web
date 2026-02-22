// scripts/gen-enci-breeds-sql.mjs
// Genera breeds.sql (species='dog') a partire dal PDF ENCI "elenco_razze_canine.pdf"
// Fonte: ENCI (PDF) https://www.enci.it/media/7967/elenco_razze_canine.pdf

import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";

const PDF_URL = "https://www.enci.it/media/7967/elenco_razze_canine.pdf";
const OUT_FILE = "breeds.sql";

function escapeSql(str) {
  return str.replace(/'/g, "''").trim();
}

// Heuristica: cattura righe tipo "242. Norsk Elghund Grigio (N)"
// Estrae il nome prima della parentesi, pulisce simboli e spazi.
function extractBreedNamesFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const names = new Set();

  for (const line of lines) {
    // match: "123. NOME ..."
    const m = line.match(/^(\d{1,4})\.\s*(.+)$/);
    if (!m) continue;

    let rest = m[2];

    // taglia tutto dopo la prima parentesi " (" se presente (di solito paese o traduzioni)
    const idx = rest.indexOf(" (");
    if (idx !== -1) rest = rest.slice(0, idx);

    // pulizia simboli comuni nel PDF (stelle, icone, ecc.)
    rest = rest
      .replace(/[★•$]+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // scarta righe vuote o troppo corte
    if (rest.length < 2) continue;

    // Alcune righe potrebbero includere "TERRA" o cose simili: scartiamo se sembra header
    const upper = rest.toUpperCase();
    if (upper === "TERRA" || upper.includes("CLUB ITALIANO RAZZE")) continue;

    names.add(rest);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "it"));
}

async function downloadPdf(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download PDF failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
}

async function main() {
  const tmpDir = path.join(process.cwd(), ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const pdfPath = path.join(tmpDir, "elenco_razze_canine.pdf");
  await downloadPdf(PDF_URL, pdfPath);

  const dataBuffer = fs.readFileSync(pdfPath);
  const parsed = await pdf(dataBuffer);

  const breeds = extractBreedNamesFromText(parsed.text);

  if (breeds.length < 50) {
    throw new Error(
      `Parsing troppo basso (${breeds.length}). Il PDF potrebbe essere cambiato: controlla output in .tmp o aggiorna regex.`,
    );
  }

  const lines = [];
  lines.push("-- AUTOGENERATO: breeds.sql (ENCI elenco razze canine riconosciute)");
  lines.push("-- Fonte: https://www.enci.it/media/7967/elenco_razze_canine.pdf");
  lines.push("begin;");
  lines.push("insert into public.breeds (species, name)");
  lines.push("values");

  for (let i = 0; i < breeds.length; i++) {
    const name = escapeSql(breeds[i]);
    const comma = i === breeds.length - 1 ? ";" : ",";
    lines.push(`('dog','${name}')${comma}`);
  }

  lines.push("on conflict (species, name) do nothing;");
  lines.push("commit;");

  fs.writeFileSync(path.join(process.cwd(), OUT_FILE), lines.join("\n") + "\n", "utf8");

  console.log(`OK: generato ${OUT_FILE} con ${breeds.length} razze cane (italiano)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});