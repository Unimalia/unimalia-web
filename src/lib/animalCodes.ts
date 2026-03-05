export type AnimalCodesInput = {
  id: string;
  chip_number: string | null;
  unimalia_code?: string | null;
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

export function getUnimaliaTextCode(a: AnimalCodesInput) {
  const code = (a.unimalia_code || "").trim();
  if (code) return `UNIMALIA:${code}`;
  return `UNIMALIA:${a.id}`;
}

export function getBarcodeValue(a: AnimalCodesInput) {
  const chip = normalizeChip(a.chip_number);
  if (chip) return chip;
  return getUnimaliaTextCode(a);
}

export function getQrValue(a: AnimalCodesInput, origin: string) {
  // QR unico: sempre /scansiona?q=
  const payload = a.chip_number ? getBarcodeValue(a) : getUnimaliaTextCode(a);
  const o = origin?.trim() || "https://unimalia.it";
  return `${o}/scansiona?q=${encodeURIComponent(payload)}`;
}