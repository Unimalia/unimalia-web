import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getEmergencyProfileByAnimalId,
  insertEmergencyAccessLog,
  resolveEmergencyToken,
  touchEmergencyToken,
  type EmergencyProfile,
} from "@/lib/emergency/repository";
import { isEmergencyTokenFormatValid } from "@/lib/emergency/token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Emergency Veterinary View",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0,
      },
    },
  };
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-neutral-900 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function EmergencyBasicView({ profile }: { profile: EmergencyProfile }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-neutral-50 px-4 py-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="text-sm font-semibold text-red-700">
          Emergency Veterinary View
        </div>
        <div className="mt-1 text-sm text-red-900">
          Scheda emergenziale con dati essenziali. Per accesso clinico completo è
          necessario accesso professionale autorizzato.
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-950">
          {profile.animal_name || "Animale"}
        </h1>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Species" value={profile.species} />
          <InfoRow label="Breed" value={profile.breed} />
          <InfoRow label="Sex" value={profile.sex} />
          <InfoRow label="Weight (kg)" value={profile.weight_kg} />
          <InfoRow label="Blood type" value={profile.blood_type} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3">
        <InfoRow label="Allergies" value={profile.allergies} />
        <InfoRow label="Active therapies" value={profile.active_therapies} />
        <InfoRow label="Chronic conditions" value={profile.chronic_conditions} />
      </section>

      {profile.premium_enabled && (
        <section className="mt-4 grid grid-cols-1 gap-3">
          <InfoRow
            label="Vaccination status"
            value={profile.essential_vaccination_status}
          />
          <InfoRow label="Advanced summary" value={profile.advanced_summary} />
          <InfoRow label="Last visit" value={profile.last_visit_summary} />
          <InfoRow
            label="Last vaccination"
            value={profile.last_vaccination_summary}
          />
        </section>
      )}

      {profile.is_lost && profile.show_emergency_contact && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-700">
            Lost animal emergency contact
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="Contact name" value={profile.emergency_contact_name} />
            <InfoRow
              label="Phone"
              value={profile.emergency_contact_phone}
            />
          </div>
        </section>
      )}

      <footer className="mt-6 text-center text-xs text-neutral-500">
        UNIMALIA · Emergency access
      </footer>
    </main>
  );
}

async function resolveInternalRedirect(animalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // TODO UNIMALIA:
  // 1. se user è owner dell'animale → redirect dashboard animale
  // 2. se user è veterinario con grant attivo → redirect cartella clinica completa
  // 3. se user è professionista senza grant → redirect vista limitata + richiesta accesso

  // Placeholder temporaneo sicuro:
  return `/animali/${animalId}`;
}

export default async function EmergencyTokenPage({ params }: PageProps) {
  const { token } = await params;
  const requestHeaders = await headers();

  const requestPath = `/e/${token}`;
  const ip =
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const userAgent = requestHeaders.get("user-agent");
  const country = requestHeaders.get("cf-ipcountry");
  const requestId =
    requestHeaders.get("cf-ray") ||
    requestHeaders.get("x-request-id") ||
    null;

  if (!isEmergencyTokenFormatValid(token)) {
    await insertEmergencyAccessLog({
      tokenHash: null,
      animalId: null,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "not_found",
      servedView: null,
      requestId,
    });

    notFound();
  }

  const resolved = await resolveEmergencyToken(token);

  if (!resolved.row || resolved.row.status !== "active") {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: null,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "not_found",
      servedView: null,
      requestId,
    });

    notFound();
  }

  if (
    resolved.row.expires_at &&
    new Date(resolved.row.expires_at).getTime() < Date.now()
  ) {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: resolved.row.animal_id,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "expired",
      servedView: null,
      requestId,
    });

    notFound();
  }

  const internalRedirect = await resolveInternalRedirect(resolved.row.animal_id);

  if (internalRedirect) {
    await touchEmergencyToken(resolved.tokenHash);

    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: resolved.row.animal_id,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "ok_internal_redirect",
      servedView: "internal_redirect",
      requestId,
    });

    redirect(internalRedirect);
  }

  const profile = await getEmergencyProfileByAnimalId(resolved.row.animal_id);

  if (!profile || !profile.enabled) {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: resolved.row.animal_id,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "disabled",
      servedView: null,
      requestId,
    });

    notFound();
  }

  await touchEmergencyToken(resolved.tokenHash);

  await insertEmergencyAccessLog({
    tokenHash: resolved.tokenHash,
    animalId: resolved.row.animal_id,
    requestPath,
    ip,
    userAgent,
    country,
    outcome: profile.premium_enabled ? "ok_public_advanced" : "ok_public_basic",
    servedView: profile.premium_enabled ? "public_advanced" : "public_basic",
    requestId,
  });

  return <EmergencyBasicView profile={profile} />;
}