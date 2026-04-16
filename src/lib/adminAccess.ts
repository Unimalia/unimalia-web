type AdminLikeUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined;

export function getEmail(u: AdminLikeUser) {
  return String(u?.email || "").toLowerCase().trim();
}

export function isAdminUser(u: AdminLikeUser) {
  if (!u) return false;

  const email = getEmail(u);

  if (email === "valentinotwister@hotmail.it") return true;

  return Boolean(u?.app_metadata?.["is_admin"] === true);
}
