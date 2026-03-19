import { supabaseAdmin } from "@/lib/supabase/server";

type CreateClinicalEventNotificationInput = {
  ownerId: string;
  animalId: string;
  animalName: string;
  eventType: string;
  shortDescription?: string | null;
};

function buildMessage(params: {
  animalName: string;
  eventType: string;
  shortDescription?: string | null;
}) {
  const animalName = params.animalName?.trim() || "Animale";
  const eventType = params.eventType?.trim() || "Evento clinico";
  const shortDescription = params.shortDescription?.trim();

  const parts = [`Animale: ${animalName}`, `Evento: ${eventType}`];

  if (shortDescription) {
    parts.push(`Dettaglio: ${shortDescription}`);
  }

  return parts.join(" • ");
}

export async function createClinicalEventOwnerNotification(
  input: CreateClinicalEventNotificationInput
) {
  const admin = supabaseAdmin();

  const message = buildMessage({
    animalName: input.animalName,
    eventType: input.eventType,
    shortDescription: input.shortDescription,
  });

  const { error } = await admin.from("owner_notifications").insert({
    owner_id: input.ownerId,
    animal_id: input.animalId,
    type: "clinical_event",
    title: "Nuovo aggiornamento clinico",
    message,
    read: false,
  });

  if (error) {
    throw new Error(`Errore creazione notifica proprietario: ${error.message}`);
  }
}