import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = path.join(process.cwd(), "public", "logo-128.webp");

if (!fs.existsSync(src)) {
  console.error("Missing:", src);
  process.exit(1);
}

const out = (name) => path.join(process.cwd(), "public", name);

const base = sharp(src).resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } });

await base.resize(512, 512).png({ compressionLevel: 9 }).toFile(out("logo-512.png"));
await base.resize(512, 512).png({ compressionLevel: 9 }).toFile(out("icon-512.png"));
await base.resize(192, 192).png({ compressionLevel: 9 }).toFile(out("icon-192.png"));
await base.resize(180, 180).png({ compressionLevel: 9 }).toFile(out("apple-touch-icon.png"));

console.log("✅ Generated: logo-512.png, icon-512.png, icon-192.png, apple-touch-icon.png");