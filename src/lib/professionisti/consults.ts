import "server-only";

import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { hasActiveGrantForAnimal } from "@/lib/professionisti/grants";

export type ConsultBox = "received" | "sent" | "archive";
export type ConsultStatus =
  | "pending"
  | "accepted"
  | "replied"
  | "closed"
  | "rejected"
  | "expired";

export type ConsultPriority = "normal" | "emergency";
export type ConsultShareMode = "full_record" | "selected_events";

type CurrentProfessionalContext = {
  userId: string;
  orgId: string | null;
  professional: {
    id: string;
    owner_id: string | null;
    display_name: string | null;
    category: string | null;
    city: string | null;
    province: string | null;
    approved: boolean | null;
    is_vet: boolean | null;
  };
};

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function normalizeStatus<T extends { status: string; expires_at: string | null }>(item: T): T {
  if (item.status === "pending" && item.expires_at) {
    const expired = new Date(item.expires_at).getTime() < Date.now();
    if (expired) {
      return { ...item, status: "expired" } as T;
    }
  }
  return item;
}

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Utente non autenticato");
  }

  return user.id;
}

export async function getCurrentProfessionalContext(): Promise<CurrentProfessionalContext> {
  const admin = supabaseAdmin();
  const userId = await getAuthenticatedUserId();
  const orgId = await getProfessionalOrgId();

  const { data, error } = await admin
    .from("professionals")
    .select("id,owner_id,display_name,category,city,province,approved,is_vet")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Scheda professionista non trovata");
  }

  return {
    userId,
    orgId,
    professional: data,
  };
}

export async function listConsultTagOptions() {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("professional_tags")
    .select("id,label,key,macro,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function searchRecipientProfessionals(params: { q?: string; tagId?: string }) {
  const admin = supabaseAdmin();
  const { userId } = await getCurrentProfessionalContext();

  let idsFromTag: string[] | null = null;

  if (params.tagId) {
    const { data: links, error: linksError } = await admin
      .from("professional_tag_links")
      .select("professional_id")
      .eq("tag_id", params.tagId);

    if (linksError) throw new Error(linksError.message);

    idsFromTag = (links ?? []).map((x) => x.professional_id);
    if (idsFromTag.length === 0) {
      return {
        professionals: [],
        tagsByProfessional: {} as Record<
          string,
          { id: string; label: string; key: string }[]
        >,
      };
    }
  }

  let query = admin
    .from("professionals")
    .select(
      "id,owner_id,display_name,category,city,province,approved,is_vet,public_visible,business_name,first_name,last_name"
    )
    .eq("approved", true)
    .eq("is_vet", true)
    .neq("owner_id", userId)
    .order("display_name", { ascending: true })
    .limit(50);

  const q = (params.q ?? "").trim();
  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,business_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,city.ilike.%${q}%,province.ilike.%${q}%`
    );
  }

  if (idsFromTag) {
    query = query.in("id", idsFromTag);
  }

  const { data: professionals, error } = await query;
  if (error) throw new Error(error.message);

  const proIds = (professionals ?? []).map((x) => x.id);
  if (proIds.length === 0) {
    return {
      professionals: [],
      tagsByProfessional: {} as Record<
        string,
        { id: string; label: string; key: string }[]
      >,
    };
  }

  const { data: links, error: linkError } = await admin
    .from("professional_tag_links")
    .select("professional_id,tag_id")
    .in("professional_id", proIds);

  if (linkError) throw new Error(linkError.message);

  const tagIds = Array.from(new Set((links ?? []).map((x) => x.tag_id)));
  const { data: tags, error: tagError } = await admin
    .from("professional_tags")
    .select("id,label,key")
    .in("id", tagIds.length ? tagIds : ["00000000-0000-0000-0000-000000000000"]);

  if (tagError) throw new Error(tagError.message);

  const tagMap = new Map((tags ?? []).map((t) => [t.id, t]));
  const tagsByProfessional: Record<string, { id: string; label: string; key: string }[]> = {};

  for (const link of links ?? []) {
    const tag = tagMap.get(link.tag_id);
    if (!tag) continue;
    if (!tagsByProfessional[link.professional_id]) tagsByProfessional[link.professional_id] = [];
    tagsByProfessional[link.professional_id].push(tag);
  }

  return {
    professionals: professionals ?? [],
    tagsByProfessional,
  };
}

export async function getComposeData(animalId: string) {
  const admin = supabaseAdmin();

  const allowed = await hasActiveGrantForAnimal(animalId);
  if (!allowed) {
    throw new Error("Grant attivo mancante per questo animale");
  }

  const { data: animalRow, error: animalError } = await admin
    .from("animals")
    .select("id,name,species,breed,sex")
    .eq("id", animalId)
    .maybeSingle();

  if (animalError) throw new Error(animalError.message);
  if (!animalRow) throw new Error("Animale non trovato");

  const animal = {
    ...animalRow,
    microchip: null,
  };

  const { data: events, error: eventsError } = await admin
    .from("animal_clinic_events")
    .select("id,event_date,type,title,description,visibility,status,priority,created_at")
    .eq("animal_id", animalId)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (eventsError) throw new Error(eventsError.message);

  return {
    animal,
    events: events ?? [],
  };
}

export async function createProfessionalConsult(input: {
  animalId: string;
  receiverProfessionalId: string;
  subject: string;
  message: string;
  shareMode: ConsultShareMode;
  priority: ConsultPriority;
  selectedEventIds?: string[];
}) {
  const admin = supabaseAdmin();
  const ctx = await getCurrentProfessionalContext();

  const allowed = await hasActiveGrantForAnimal(input.animalId);
  if (!allowed) {
    throw new Error("Grant attivo mancante per questo animale");
  }

  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!subject) throw new Error("Oggetto obbligatorio");
  if (!input.receiverProfessionalId) throw new Error("Destinatario obbligatorio");
  if (input.receiverProfessionalId === ctx.professional.id) {
    throw new Error("Non puoi inviare un consulto a te stesso");
  }

  const { data: animal, error: animalError } = await admin
    .from("animals")
    .select("id,name")
    .eq("id", input.animalId)
    .maybeSingle();

  if (animalError) throw new Error(animalError.message);
  if (!animal) throw new Error("Animale non trovato");

  const { data: receiver, error: receiverError } = await admin
    .from("professionals")
    .select("id,display_name,approved,is_vet")
    .eq("id", input.receiverProfessionalId)
    .maybeSingle();

  if (receiverError) throw new Error(receiverError.message);
  if (!receiver) throw new Error("Destinatario non trovato");
  if (!receiver.approved || !receiver.is_vet) {
    throw new Error("Il destinatario non è disponibile per i consulti veterinari");
  }

  const { data: allEvents, error: eventsError } = await admin
    .from("animal_clinic_events")
    .select("id")
    .eq("animal_id", input.animalId);

  if (eventsError) throw new Error(eventsError.message);

  const allEventIds = (allEvents ?? []).map((x) => x.id);

  const eventIds =
    input.shareMode === "full_record"
      ? allEventIds
      : Array.from(new Set((input.selectedEventIds ?? []).filter(Boolean)));

  if (eventIds.length === 0) {
    throw new Error("Seleziona almeno un evento clinico");
  }

  const invalid = eventIds.find((id) => !allEventIds.includes(id));
  if (invalid) {
    throw new Error("Uno o più eventi selezionati non appartengono all'animale");
  }

  const expiresAt = input.priority === "emergency" ? hoursFromNow(24) : hoursFromNow(24 * 7);

  const senderName = ctx.professional.display_name?.trim() || "Professionista mittente";
  const receiverName = receiver.display_name?.trim() || "Professionista destinatario";

  const { data: inserted, error: insertError } = await admin
    .from("professional_consult_requests")
    .insert({
      animal_id: input.animalId,
      animal_name: animal.name ?? "Animale",
      sender_user_id: ctx.userId,
      sender_org_id: ctx.orgId,
      sender_professional_id: ctx.professional.id,
      sender_display_name: senderName,
      receiver_professional_id: receiver.id,
      receiver_display_name: receiverName,
      subject,
      initial_message: message || null,
      share_mode: input.shareMode,
      priority: input.priority,
      status: "pending",
      expires_at: expiresAt,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);
  if (!inserted) throw new Error("Errore creazione consulto");

  const sharedRows = eventIds.map((eventId) => ({
    consult_id: inserted.id,
    event_id: eventId,
  }));

  const { error: sharedError } = await admin
    .from("professional_consult_shared_events")
    .insert(sharedRows);

  if (sharedError) throw new Error(sharedError.message);

  const { error: msgError } = await admin
    .from("professional_consult_messages")
    .insert({
      consult_id: inserted.id,
      sender_user_id: ctx.userId,
      sender_professional_id: ctx.professional.id,
      sender_display_name: senderName,
      message_type: "initial",
      message: message || `Richiesta consulto per ${animal.name ?? "animale"}`,
    });

  if (msgError) throw new Error(msgError.message);

  return { id: inserted.id };
}

export async function listProfessionalConsults(params: {
  box?: ConsultBox;
  status?: string;
  priority?: string;
  q?: string;
}) {
  const admin = supabaseAdmin();
  const ctx = await getCurrentProfessionalContext();

  await admin
    .from("professional_consult_requests")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const box = params.box ?? "received";

  let query = admin
    .from("professional_consult_requests")
    .select("*")
    .order("priority", { ascending: false })
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (box === "received") {
    query = query.eq("receiver_professional_id", ctx.professional.id).in("status", [
      "pending",
      "accepted",
      "replied",
    ]);
  } else if (box === "sent") {
    query = query.eq("sender_professional_id", ctx.professional.id).in("status", [
      "pending",
      "accepted",
      "replied",
    ]);
  } else {
    query = query
      .or(
        `sender_professional_id.eq.${ctx.professional.id},receiver_professional_id.eq.${ctx.professional.id}`
      )
      .in("status", ["closed", "rejected", "expired"]);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.priority) {
    query = query.eq("priority", params.priority);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const q = (params.q ?? "").trim().toLowerCase();

  const filtered = (data ?? [])
    .map((x) => normalizeStatus(x))
    .filter((item) => {
      if (!q) return true;
      return [
        item.animal_name,
        item.subject,
        item.sender_display_name,
        item.receiver_display_name,
        item.initial_message,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

  return filtered;
}

export async function getProfessionalConsultDetail(id: string) {
  const admin = supabaseAdmin();
  const ctx = await getCurrentProfessionalContext();

  await admin
    .from("professional_consult_requests")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .eq("id", id);

  const { data: consult, error: consultError } = await admin
    .from("professional_consult_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (consultError) throw new Error(consultError.message);
  if (!consult) throw new Error("Consulto non trovato");

  const isParticipant =
    consult.sender_professional_id === ctx.professional.id ||
    consult.receiver_professional_id === ctx.professional.id;

  if (!isParticipant) {
    throw new Error("Non autorizzato");
  }

  const { data: sharedRows, error: sharedError } = await admin
    .from("professional_consult_shared_events")
    .select("event_id")
    .eq("consult_id", id);

  if (sharedError) throw new Error(sharedError.message);

  const eventIds = (sharedRows ?? []).map((x) => x.event_id);

  const { data: events, error: eventsError } = await admin
    .from("animal_clinic_events")
    .select("id,event_date,type,title,description,visibility,status,priority,created_at,meta")
    .in("id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"])
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (eventsError) throw new Error(eventsError.message);

  const { data: files, error: filesError } = await admin
    .from("animal_clinic_event_files")
    .select("id,event_id,filename,path,mime,size,created_at")
    .in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true });

  if (filesError) throw new Error(filesError.message);

  const filesByEvent: Record<string, any[]> = {};
  for (const file of files ?? []) {
    if (!filesByEvent[file.event_id]) filesByEvent[file.event_id] = [];
    filesByEvent[file.event_id].push(file);
  }

  const { data: messages, error: messagesError } = await admin
    .from("professional_consult_messages")
    .select("*")
    .eq("consult_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    consult: normalizeStatus(consult),
    currentProfessionalId: ctx.professional.id,
    events: (events ?? []).map((event) => ({
      ...event,
      files: filesByEvent[event.id] ?? [],
    })),
    messages: messages ?? [],
  };
}

export async function updateProfessionalConsult(input: {
  id: string;
  action: "accept" | "reject" | "reply" | "close";
  message?: string;
}) {
  const admin = supabaseAdmin();
  const ctx = await getCurrentProfessionalContext();

  const { data: consult, error } = await admin
    .from("professional_consult_requests")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!consult) throw new Error("Consulto non trovato");

  const current = normalizeStatus(consult);

  const isSender = current.sender_professional_id === ctx.professional.id;
  const isReceiver = current.receiver_professional_id === ctx.professional.id;
  const isParticipant = isSender || isReceiver;

  if (!isParticipant) throw new Error("Non autorizzato");

  const senderName = ctx.professional.display_name?.trim() || "Professionista";

  if (input.action === "accept") {
    if (!isReceiver) throw new Error("Solo il destinatario può accettare");
    if (current.status !== "pending") throw new Error("Il consulto non è più in attesa");

    const { error: updateError } = await admin
      .from("professional_consult_requests")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  }

  if (input.action === "reject") {
    if (!isReceiver) throw new Error("Solo il destinatario può rifiutare");
    if (current.status !== "pending") throw new Error("Il consulto non è più in attesa");

    const { error: updateError } = await admin
      .from("professional_consult_requests")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  }

  if (input.action === "reply") {
    const message = (input.message ?? "").trim();
    if (!message) throw new Error("Messaggio obbligatorio");
    if (!["accepted", "replied"].includes(current.status)) {
      throw new Error("Il consulto deve prima essere accettato");
    }

    const { error: msgError } = await admin
      .from("professional_consult_messages")
      .insert({
        consult_id: input.id,
        sender_user_id: ctx.userId,
        sender_professional_id: ctx.professional.id,
        sender_display_name: senderName,
        message_type: "reply",
        message,
      });

    if (msgError) throw new Error(msgError.message);

    const { error: updateError } = await admin
      .from("professional_consult_requests")
      .update({
        status: "replied",
        replied_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) throw new Error(updateError.message);

    return { ok: true };
  }

  if (input.action === "close") {
    if (!["accepted", "replied"].includes(current.status)) {
      throw new Error("Puoi chiudere solo un consulto attivo");
    }

    const { error: noteError } = await admin
      .from("professional_consult_messages")
      .insert({
        consult_id: input.id,
        sender_user_id: ctx.userId,
        sender_professional_id: ctx.professional.id,
        sender_display_name: senderName,
        message_type: "closure",
        message: "Consulto chiuso",
      });

    if (noteError) throw new Error(noteError.message);

    const { error: updateError } = await admin
      .from("professional_consult_requests")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) throw new Error(updateError.message);

    return { ok: true };
  }

  throw new Error("Azione non valida");
}