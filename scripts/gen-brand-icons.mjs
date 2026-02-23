import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const SRC = path.join(root, "public", "brand", "logo-master.webp");

if (!fs.existsSync(SRC)) {
  console.error("❌ File sorgente non trovato:", SRC);
  process.exit(1);
}

const out = (p) => path.join(root, "public", p);

// fondo bianco per icone/google (pulito su SERP)
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function makeSquare(size) {
  const img = sharp(SRC);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("Impossibile leggere dimensioni sorgente.");

  const scale = Math.min(size / meta.width, size / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);

  const resized = await img.resize(w, h, { fit: "contain" }).png({ compressionLevel: 9 }).toBuffer();

  const left = Math.floor((size - w) / 2);
  const top = Math.floor((size - h) / 2);

  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  }).composite([{ input: resized, left, top }]);
}

async function run() {
  await (await makeSquare(512)).png({ compressionLevel: 9 }).toFile(out("logo-512.png"));
  await (await makeSquare(512)).png({ compressionLevel: 9 }).toFile(out("icon-512.png"));
  await (await makeSquare(192)).png({ compressionLevel: 9 }).toFile(out("icon-192.png"));
  await (await makeSquare(180)).png({ compressionLevel: 9 }).toFile(out("apple-touch-icon.png"));
  await (await makeSquare(32)).png({ compressionLevel: 9 }).toFile(out("favicon-32.png"));

  console.log("✅ Rigenerati:");
  console.log(" - public/logo-512.png");
  console.log(" - public/icon-512.png");
  console.log(" - public/icon-192.png");
  console.log(" - public/apple-touch-icon.png");
  console.log(" - public/favicon-32.png");
}

run().catch((e) => {
  console.error("❌ Errore:", e);
  process.exit(1);
});