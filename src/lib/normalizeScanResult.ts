// src/lib/normalizeScanResult.ts
export function normalizeScanResult(raw: string) {
  const value = (raw ?? "")
    .trim()
    .replace(/\u0000/g, "")
    .replace(/\r?\n/g, "");

  // puoi aggiungere qui normalizzazioni future (prefissi, ecc.)
  return value;
}