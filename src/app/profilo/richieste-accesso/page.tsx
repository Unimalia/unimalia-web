import OwnerRequestsClient from "./OwnerRequestsClient";

export const dynamic = "force-dynamic";

export default async function OwnerAccessRequestsPage() {
  // ✅ La pagina non pre-carica nulla: il client fetch-a da /api/owner/access-requests
  return <OwnerRequestsClient />;
}