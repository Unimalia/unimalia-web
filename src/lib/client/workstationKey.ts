const STORAGE_KEY = "unimalia:clinic-workstation-key";

function generateWorkstationKey() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(16).slice(2)}`;

  return `ws_${randomPart}`.toLowerCase();
}

export function getWorkstationKey() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(STORAGE_KEY)?.trim() || "";
  if (existing) return existing;

  const created = generateWorkstationKey();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}