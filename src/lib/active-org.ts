import { cookies } from "next/headers";

const COOKIE_NAME = "unimalia_active_org";

export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME)?.value;
  return c && c.trim().length > 0 ? c : null;
}

export async function setActiveOrgIdCookie(orgId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveOrgIdCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}