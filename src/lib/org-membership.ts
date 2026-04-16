export type OrgMemberRole = "org_owner" | "vet" | "assistant" | "front_desk";
export type OrgMemberStatus = "invited" | "active" | "suspended";

export type OrgMembership = {
  organizationId: string;
  organizationName: string;
  memberRole: OrgMemberRole;
  status: OrgMemberStatus;
  isDefault?: boolean;
};

// Regole minime: attivo = puÃ² operare
export function isActiveMember(m: OrgMembership) {
  return m.status === "active";
}

// Solo vet puÃ² validare (poi aggiungeremo â€œvet verificatoâ€)
export function canVerifyClinicEvents(m: OrgMembership) {
  return isActiveMember(m) && (m.memberRole === "vet" || m.memberRole === "org_owner");
}
