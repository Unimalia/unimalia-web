export function getEmail(u: any) {
  return String(u?.email || "").toLowerCase().trim();
}

export function isAdminUser(u: any) {
  if (!u) return false;

  const email = getEmail(u);

  // Admin temporanei hardcoded iniziali
  // Qui mettiamo il tuo account per iniziare a costruire l'area superadmin.
  if (email === "valentinotwister@hotmail.it") return true;

  return Boolean(u?.app_metadata?.is_admin || u?.user_metadata?.is_admin);
}