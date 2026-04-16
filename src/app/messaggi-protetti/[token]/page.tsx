import { supabaseAdmin } from "@/lib/supabase/server";
import ProtectedConversationClient from "./ProtectedConversationClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function MessaggiProtettiPage({ params }: PageProps) {
  const { token } = await params;
  const admin = supabaseAdmin();

  const { data: conversation, error } = await admin
    .from("report_conversations")
    .select(`
      id,
      report_id,
      owner_email,
      requester_email,
      owner_token,
      requester_token,
      last_message_at,
      reports:report_id ( id, title, status )
    `)
    .or(`owner_token.eq.${token},requester_token.eq.${token}`)
    .single();

  if (error || !conversation) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-[1.9rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_12px_32px_rgba(42,56,86,0.06)]">
            <h1 className="text-2xl font-semibold tracking-tight text-[#30486f]">
              Conversazione non disponibile
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#5f708a]">
              Questo link potrebbe essere errato, scaduto oppure non più disponibile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const report = Array.isArray(conversation.reports)
    ? conversation.reports[0]
    : conversation.reports;

  const { data: messages } = await admin
    .from("report_conversation_messages")
    .select("id, sender_role, message, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  const viewerRole = conversation.owner_token === token ? "owner" : "requester";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <ProtectedConversationClient
          token={token}
          viewerRole={viewerRole}
          reportTitle={report?.title || "Annuncio UNIMALIA"}
          reportStatus={report?.status || "active"}
          messages={(messages ?? []) as Array<{
            id: string;
            sender_role: "owner" | "requester";
            message: string;
            created_at: string;
          }>}
        />
      </section>
    </main>
  );
}