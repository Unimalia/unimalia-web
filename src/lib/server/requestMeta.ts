export function getRequestMeta(req: Request) {
  const ua = req.headers.get("user-agent") || null;
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || null;
  return { ip, ua };
}