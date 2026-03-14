export function getEmail(u: any) {
  return String(u?.email || "").toLowerCase().trim();
}

export function isAdminUser(u: any) {
  if (!u) return false;

  const email = getEmail(u);

  if (email === "valentinotwister@hotmail.it") return true;

  return Boolean(u?.app_metadata?.is_admin === true);
}