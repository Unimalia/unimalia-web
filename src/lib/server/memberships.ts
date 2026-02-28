import "server-only";
import { OrgMembership } from "@/lib/org-membership";
import { getCurrentUserEmailOrThrow } from "@/lib/server/session"; // adatta

// TODO: sostituisci con query DB reale
export async function getUserMemberships(): Promise<OrgMembership[]> {
  const email = await getCurrentUserEmailOrThrow();

  // ESEMPIO: qui fai query sulle tue tabelle organization_members + organizations
  // return db.organizationMembers.findMany(...)

  // Placeholder: sostituisci subito con DB
  return [
    // { organizationId: "org_1", organizationName: "Clinica X", memberRole: "vet", status: "active", isDefault: true },
  ];
}