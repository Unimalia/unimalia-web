import { NextResponse } from "next/server";
import { setActiveOrgIdCookie, clearActiveOrgIdCookie } from "@/lib/active-org";
import { getUserMemberships } from "@/lib/server/memberships";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const orgId = body?.orgId as string | undefined;

  if (!orgId) {
    return NextResponse.json({ ok: false, error: "Missing orgId" }, { status: 400 });
  }

  const memberships = await getUserMemberships();
  const allowed = memberships.some((m) => m.organizationId === orgId && m.status === "active");

  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await setActiveOrgIdCookie(orgId);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearActiveOrgIdCookie();
  return NextResponse.json({ ok: true });
}