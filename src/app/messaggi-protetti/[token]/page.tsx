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
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Conversazione non disponibile
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Questo link potrebbe essere errato, scaduto oppure non più disponibile.
          </p>
        </div>
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
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
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
    </main>
  );
}