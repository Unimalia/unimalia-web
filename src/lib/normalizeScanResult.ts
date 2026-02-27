// src/lib/normalizeScanResult.ts

function cleanBase(raw: string) {
  return (raw ?? "")
    .trim()
    .replace(/\u0000/g, "")
    .replace(/\r?\n/g, "")
    .trim();
}

export function normalizeScanResult(raw: string) {
  let value = cleanBase(raw);

  if (!value) return "";

  // 🔹 Normalizza eventuale protocollo custom (es: unimalia://xxxx)
  value = value.replace(/^unimalia:\/\//i, "");

  // 🔹 Supporta prefisso UNIMALIA:XXXX oppure UNIMALIA-XXXX
  const unimaliaMatch = value.match(/^unimalia[:\-](.+)$/i);
  if (unimaliaMatch?.[1]) {
    return unimaliaMatch[1].trim();
  }

  // 🔹 Se è un URL e contiene UNIMALIA: come parametro, lo lascia intatto
  // (sarà gestito dallo scanner page)

  return value;
}