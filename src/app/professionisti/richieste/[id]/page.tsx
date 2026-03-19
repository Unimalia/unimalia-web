"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { authHeaders } from "@/lib/client/authHeaders";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

type EventFileLike = {
  id?: string;
  filename?: string | null;
  path?: string | null;
  mime?: string | null;
  size?: number | null;
};

type ConsultMessageFileLike = {
  id?: string;
  filename?: string | null;
  path?: string | null;
  mime?: string | null;
  size?: number | null;
};

function buildEventDownloadHref(file?: EventFileLike | null) {
  if (!file?.path) return null;

  const params = new URLSearchParams({ path: file.path });
  if (file.filename) params.set("filename", file.filename);

  return `/api/clinic-events/files/download?${params.toString()}`;
}

function formatBytes(size?: number | null) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value < 10 && unitIndex > 0 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

function extractText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(extractText)
      .filter(Boolean)
      .join(" ");
  }
  return String(value).trim();
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null) {
  const date = normalizeDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  const date = normalizeDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isFutureDate(value?: string | null) {
  const date = normalizeDate(value);
  if (!date) return false;
  return date.getTime() > Date.now();
}

function pickLatestByDate<T extends Record<string, unknown>>(
  items: T[],
  getDate: (item: T) => string | null | undefined
) {
  return (
    [...items]
      .filter((item) => normalizeDate(getDate(item)))
      .sort((a, b) => {
        const da = normalizeDate(getDate(a))!;
        const db = normalizeDate(getDate(b))!;
        return db.getTime() - da.getTime();
      })[0] ?? null
  );
}

function pickNearestFuture<T extends Record<string, unknown>>(
  items: T[],
  getDate: (item: T) => string | null | undefined
) {
  return (
    [...items]
      .filter((item) => isFutureDate(getDate(item)))
      .sort((a, b) => {
        const da = normalizeDate(getDate(a))!;
        const db = normalizeDate(getDate(b))!;
        return da.getTime() - db.getTime();
      })[0] ?? null
  );
}

type ConsultDetail = {
  consult: {
    id: string;
    animal_id: string;
    animal_name: string;
    sender_display_name: string;
    receiver_display_name: string;
    sender_professional_id: string;
    receiver_professional_id: string;
    subject: string;
    initial_message: string | null;
    share_mode: "full_record" | "selected_events";
    priority: "normal" | "emergency";
    status: "pending" | "accepted" | "replied" | "closed" | "rejected" | "expired";
    created_at: string;
    expires_at: string;
  };
  currentProfessionalId: string;
  messages: Array<{
    id: string;
    sender_professional_id: string;
    sender_display_name: string;
    message_type: string;
    message: string;
    created_at: string;
    files?: ConsultMessageFileLike[];
  }>;
  events: Array<{
    id: string;
    animal_id?: string;
    event_date: string | null;
    type: string | null;
    title: string | null;
    description: string | null;
    visibility: string | null;
    status: string | null;
    priority: string | null;
    performed_at?: string | null;
    scheduled_for?: string | null;
    created_at?: string | null;
    weight?: string | number | null;
    weight_kg?: string | number | null;
    data?: unknown;
    payload?: unknown;
    meta?: unknown;
    files: EventFileLike[];
  }>;
  animal?: {
    id?: string | null;
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    chip_number?: string | null;
    owner_name?: string | null;
    owner_email?: string | null;
    weight?: string | null;
    peso?: string | null;
    age?: string | null;
    eta?: string | null;
    birth_date?: string | null;
    sterilized?: boolean | null;
  } | null;
  quickSummary?: {
    age: string;
    weight: string;
    bloodType: string;
    sterilizationStatus: string;
    allergies: string[];
    activeTherapies: string[];
    lastTherapies: string[];
    chronicPathologies: string[];
    nextRecall: string | null;
    latestVisit: string | null;
    latestVaccination: string | null;
    vaccinationExpiry: string | null;
  } | null;
};

type AnimalSummary = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  chip_number?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  weight?: string | null;
  age?: string | null;
  birth_date?: string | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "In attesa";
    case "accepted":
      return "Accettato";
    case "replied":
      return "Con risposta";
    case "closed":
      return "Chiuso";
    case "rejected":
      return "Rifiutato";
    case "expired":
      return "Scaduto";
    default:
      return status;
  }
}

function typeLabel(t?: string | null) {
  switch (t) {
    case "visit":
      return "Visita";
    case "vaccine":
      return "Vaccinazione";
    case "exam":
      return "Esame";
    case "therapy":
      return "Terapia";
    case "surgery":
      return "Intervento chirurgico";
    case "note":
      return "Nota";
    case "chronic_condition":
      return "Patologia cronica";
    case "follow_up":
      return "Ricontrollo";
    default:
      return t || "Evento";
  }
}

function normalizeChip(raw?: string | null) {
  return String(raw || "").replace(/\s+/g, "").trim();
}

export default function ProfessionistiRichiestaDettaglioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const consultId = String(params.id || "");

  const [data, setData] = useState<ConsultDetail | null>(null);
  const [animal, setAnimal] = useState<AnimalSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReplyFiles, setSendingReplyFiles] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<ConsultDetail["events"][number] | null>(null);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const sharedEvents = useMemo(() => {
    return Array.isArray(data?.events) ? data.events : [];
  }, [data]);

  async function loadConsultDetail(keepSelectedEventId?: string | null) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/professionisti/consults/${consultId}`, {
        cache: "no-store",
      });
      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          (json as { error?: string; raw?: string })?.error ||
            (json as { error?: string; raw?: string })?.raw ||
            "Errore caricamento consulto"
        );
      }

      const detail = json as ConsultDetail;
      setData(detail);

      const fallbackAnimal = detail?.animal ?? null;
      const animalId = detail?.consult?.animal_id;

      if (animalId) {
        try {
          const animalRes = await fetch(
            `/api/professionisti/animal?animalId=${encodeURIComponent(animalId)}`,
            {
              cache: "no-store",
              headers: {
                ...(await authHeaders()),
              },
            }
          );

          if (animalRes.ok) {
            const animalJson = await safeJson(animalRes);
            const a =
              (animalJson as { animal?: ConsultDetail["animal"] | null })?.animal || fallbackAnimal;

            setAnimal(
              a
                ? {
                    id: a.id ?? animalId,
                    name: a.name ?? null,
                    species: a.species ?? null,
                    breed: a.breed ?? null,
                    chip_number: a.chip_number ?? null,
                    owner_name: a.owner_name ?? null,
                    owner_email: a.owner_email ?? null,
                    weight: a.weight ?? a.peso ?? null,
                    age: a.age ?? a.eta ?? null,
                    birth_date: a.birth_date ?? null,
                  }
                : null
            );
          } else if (fallbackAnimal) {
            setAnimal({
              id: fallbackAnimal.id ?? animalId,
              name: fallbackAnimal.name ?? null,
              species: fallbackAnimal.species ?? null,
              breed: fallbackAnimal.breed ?? null,
              chip_number: fallbackAnimal.chip_number ?? null,
              owner_name: fallbackAnimal.owner_name ?? null,
              owner_email: fallbackAnimal.owner_email ?? null,
              weight: fallbackAnimal.weight ?? fallbackAnimal.peso ?? null,
              age: fallbackAnimal.age ?? fallbackAnimal.eta ?? null,
              birth_date: fallbackAnimal.birth_date ?? null,
            });
          } else {
            setAnimal(null);
          }
        } catch {
          if (fallbackAnimal) {
            setAnimal({
              id: fallbackAnimal.id ?? animalId,
              name: fallbackAnimal.name ?? null,
              species: fallbackAnimal.species ?? null,
              breed: fallbackAnimal.breed ?? null,
              chip_number: fallbackAnimal.chip_number ?? null,
              owner_name: fallbackAnimal.owner_name ?? null,
              owner_email: fallbackAnimal.owner_email ?? null,
              weight: fallbackAnimal.weight ?? fallbackAnimal.peso ?? null,
              age: fallbackAnimal.age ?? fallbackAnimal.eta ?? null,
              birth_date: fallbackAnimal.birth_date ?? null,
            });
          } else {
            setAnimal(null);
          }
        }
      } else {
        setAnimal(null);
      }

      if (keepSelectedEventId) {
        const refreshedEvent = detail.events.find((e) => e.id === keepSelectedEventId) ?? null;
        setSelectedEvent(refreshedEvent);
      } else {
        setSelectedEvent(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConsultDetail();
  }, [consultId]);

  useEffect(() => {
    if (!selectedEvent) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedEvent]);

  const canAcceptReject = useMemo(() => {
    if (!data) return false;
    return (
      data.consult.receiver_professional_id === data.currentProfessionalId &&
      data.consult.status === "pending"
    );
  }, [data]);

  const canReply = useMemo(() => {
    if (!data) return false;
    return ["accepted", "replied"].includes(data.consult.status);
  }, [data]);

  const canClose = useMemo(() => {
    if (!data) return false;
    return ["accepted", "replied"].includes(data.consult.status);
  }, [data]);

  function handleReplyFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    setReplyFiles(files);
  }

  function removeReplyFile(indexToRemove: number) {
    setReplyFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  const rapidClinicalState = useMemo(() => {
    if (data?.quickSummary) {
      return {
        age: data.quickSummary.age || "—",
        weight: data.quickSummary.weight || "—",
        bloodType: data.quickSummary.bloodType || "Non rilevato",
        sterilizationStatus: data.quickSummary.sterilizationStatus || "—",
        allergies: Array.isArray(data.quickSummary.allergies)
          ? data.quickSummary.allergies.slice(0, 3)
          : [],
        activeTherapies: Array.isArray(data.quickSummary.activeTherapies)
          ? data.quickSummary.activeTherapies.slice(0, 3).map((text) => ({
              title: text,
              description: text,
              event_date: null,
            }))
          : [],
        lastTherapies: Array.isArray(data.quickSummary.lastTherapies)
          ? data.quickSummary.lastTherapies.slice(0, 3).map((text) => ({
              title: text,
              description: text,
              event_date: null,
            }))
          : [],
        chronicPathologies: Array.isArray(data.quickSummary.chronicPathologies)
          ? data.quickSummary.chronicPathologies.slice(0, 3).map((text) => ({
              title: text,
              description: text,
              event_date: null,
            }))
          : [],
        nextRecall: data.quickSummary.nextRecall,
        latestVisit: data.quickSummary.latestVisit,
        latestVaccination: data.quickSummary.latestVaccination,
        vaccinationExpiry: data.quickSummary.vaccinationExpiry,
      };
    }

    const events = Array.isArray(sharedEvents) ? sharedEvents : [];

    const normalized = events.map((event) => {
      const title = extractText(event?.title);
      const description = extractText(event?.description);
      const type = extractText(event?.type).toLowerCase();
      const date =
        event?.event_date || event?.performed_at || event?.scheduled_for || event?.created_at || null;

      const payload = event?.payload || event?.data || {};

      return {
        raw: event,
        title,
        description,
        type,
        date,
        payload,
        text: `${title} ${description} ${extractText(payload)}`.toLowerCase(),
      };
    });

    const allergies = normalized.filter(
      (e) => e.text.includes("allerg") || e.type.includes("allerg")
    );

    const activeTherapies = normalized.filter(
      (e) =>
        e.text.includes("terapia attiva") ||
        e.text.includes("in terapia") ||
        e.text.includes("somministrazione") ||
        e.type.includes("therapy")
    );

    const therapies = normalized.filter(
      (e) => e.text.includes("terapia") || e.text.includes("farmaco") || e.type.includes("therapy")
    );

    const chronicPathologies = normalized.filter(
      (e) =>
        e.text.includes("cron") || e.text.includes("patologia") || e.text.includes("diagnosi")
    );

    const visits = normalized.filter(
      (e) => e.text.includes("visita") || e.type.includes("visit") || e.type.includes("check")
    );

    const vaccinations = normalized.filter(
      (e) => e.text.includes("vaccin") || e.type.includes("vacc")
    );

    const recalls = normalized.filter(
      (e) =>
        e.text.includes("ricontroll") ||
        e.text.includes("follow-up") ||
        e.text.includes("follow up") ||
        e.text.includes("controllo programmato")
    );

    const latestVisit = pickLatestByDate(visits, (item) => item.date);
    const latestVaccination = pickLatestByDate(vaccinations, (item) => item.date);
    const nextRecall = pickNearestFuture(recalls, (item) => item.date);
    const vaccinationExpiry = pickNearestFuture(
      vaccinations.filter((e) => e.text.includes("scadenza") || e.text.includes("richiamo")),
      (item) => item.date
    );

    const lastTherapies = [...therapies]
      .filter((item) => normalizeDate(item.date))
      .sort((a, b) => normalizeDate(b.date)!.getTime() - normalizeDate(a.date)!.getTime())
      .slice(0, 3);

    const eventsByDateDesc = [...events].sort((a: any, b: any) => {
      const da = normalizeDate(
        a?.event_date || a?.performed_at || a?.scheduled_for || a?.created_at
      );
      const db = normalizeDate(
        b?.event_date || b?.performed_at || b?.scheduled_for || b?.created_at
      );

      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;

      return db.getTime() - da.getTime();
    });

    const latestDetectedWeight =
      eventsByDateDesc
        .map((event: any) => {
          const meta = (event?.meta as Record<string, unknown> | undefined) ?? {};
          const payload = (event?.payload as Record<string, unknown> | undefined) ?? {};
          const dataObj = (event?.data as Record<string, unknown> | undefined) ?? {};

          return (
            extractText(event?.weight_kg) ||
            extractText(event?.weight) ||
            extractText(payload?.weight) ||
            extractText(payload?.peso) ||
            extractText(dataObj?.weight) ||
            extractText(dataObj?.peso) ||
            extractText(meta?.weight_kg) ||
            extractText(meta?.weight) ||
            extractText(meta?.peso)
          );
        })
        .find(Boolean) || "";

    const latestVisitMeta = (latestVisit?.raw?.meta as Record<string, unknown> | undefined) ?? {};
    const latestVisitPayload =
      (latestVisit?.raw?.payload as Record<string, unknown> | undefined) ?? {};
    const latestVisitData = (latestVisit?.raw?.data as Record<string, unknown> | undefined) ?? {};

    const animalWeight =
      extractText(data?.animal?.weight) ||
      extractText(data?.animal?.peso) ||
      extractText(animal?.weight) ||
      latestDetectedWeight ||
      extractText(latestVisit?.raw?.weight_kg) ||
      extractText(latestVisit?.raw?.weight) ||
      extractText(latestVisitPayload?.weight) ||
      extractText(latestVisitData?.weight) ||
      extractText(latestVisitMeta?.weight_kg) ||
      extractText(latestVisitMeta?.weight) ||
      extractText(latestVisitMeta?.peso);

    const animalAge =
      extractText(data?.animal?.age) ||
      extractText(data?.animal?.eta) ||
      extractText(animal?.age) ||
      (extractText(data?.animal?.birth_date || animal?.birth_date)
        ? formatDate(data?.animal?.birth_date || animal?.birth_date)
        : "");

    const bloodType =
      extractText(latestVisitMeta?.blood_type) ||
      extractText(latestVisitMeta?.bloodType) ||
      extractText(latestVisitPayload?.blood_type) ||
      extractText(latestVisitPayload?.bloodType) ||
      extractText(latestVisitData?.blood_type) ||
      extractText(latestVisitData?.bloodType);

    return {
      age: animalAge || "—",
      weight: animalWeight || "—",
      bloodType: bloodType || "Non rilevato",
      sterilizationStatus:
        data?.animal?.sterilized === true
          ? "Sterilizzato / castrato"
          : data?.animal?.sterilized === false
            ? "Non sterilizzato / non castrato"
            : "—",
      allergies: allergies.slice(0, 3),
      activeTherapies: activeTherapies.slice(0, 3),
      lastTherapies,
      chronicPathologies: chronicPathologies.slice(0, 3),
      nextRecall,
      latestVisit,
      latestVaccination,
      vaccinationExpiry,
    };
  }, [sharedEvents, data, animal]);

  const filteredSharedEvents = useMemo(() => {
    const events = Array.isArray(sharedEvents) ? sharedEvents : [];
    if (filter === "all") return events;

    return events.filter((event) => {
      const type = extractText(event?.type).toLowerCase();
      const text = `${extractText(event?.title)} ${extractText(event?.description)}`.toLowerCase();

      switch (filter) {
        case "visits":
          return type.includes("visit") || text.includes("visita");
        case "therapies":
          return type.includes("therapy") || text.includes("terapia");
        case "vaccines":
          return type.includes("vacc") || text.includes("vaccin");
        case "files":
          return Array.isArray(event?.files) && event.files.length > 0;
        default:
          return true;
      }
    });
  }, [sharedEvents, filter]);

  async function runAction(action: "accept" | "reject" | "close") {
    try {
      setSaving(true);

      const res = await fetch(`/api/professionisti/consults/${consultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(
          (json as { error?: string; raw?: string })?.error ||
            (json as { error?: string; raw?: string })?.raw ||
            "Errore aggiornamento consulto"
        );
      }

      await loadConsultDetail(selectedEvent?.id ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    if (!consultId) return;

    if (!reply.trim()) {
      alert("Scrivi un testo di risposta prima dell'invio.");
      return;
    }

    try {
      setSendingReply(true);

      const res = await fetch(`/api/professionisti/consults/${consultId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reply",
          message: reply.trim(),
        }),
      });

      const responseData = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          (responseData as { error?: string; raw?: string })?.error ||
            (responseData as { error?: string; raw?: string })?.raw ||
            "Errore durante l'invio della risposta."
        );
      }

      const messageId =
        (responseData as { messageId?: string; message?: { id?: string } })?.messageId ||
        (responseData as { message?: { id?: string } })?.message?.id ||
        null;

      if (messageId && replyFiles.length > 0) {
        setSendingReplyFiles(true);

        const formData = new FormData();
        formData.append("messageId", messageId);
        formData.append("consultId", consultId);

        for (const file of replyFiles) {
          formData.append("files", file);
        }

        const uploadRes = await fetch("/api/professionisti/consults/messages/files/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await safeJson(uploadRes);

        if (!uploadRes.ok) {
          throw new Error(
            (uploadData as { error?: string; raw?: string })?.error ||
              (uploadData as { error?: string; raw?: string })?.raw ||
              "Risposta inviata, ma upload allegati fallito."
          );
        }
      }

      setReply("");
      setReplyFiles([]);

      await loadConsultDetail(selectedEvent?.id ?? null);
    } catch (uploadError) {
      console.error(uploadError);
      alert(
        uploadError instanceof Error
          ? uploadError.message
          : "Errore durante l'invio della risposta."
      );
    } finally {
      setSendingReply(false);
      setSendingReplyFiles(false);
    }
  }

  async function uploadEventFiles(eventId: string, files: File[]) {
    if (!data || !files.length) return;

    try {
      setUploadingFiles(true);

      const fd = new FormData();
      fd.append("eventId", eventId);
      fd.append("animalId", data.consult.animal_id);
      for (const file of files) {
        fd.append("files", file);
      }

      const res = await fetch("/api/clinic-events/files/upload", {
        method: "POST",
        headers: {
          ...(await authHeaders()),
        },
        body: fd,
      });

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(
          (json as { error?: string; raw?: string })?.error ||
            (json as { error?: string; raw?: string })?.raw ||
            "Errore caricamento allegati"
        );
      }

      await loadConsultDetail(eventId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore caricamento allegati");
    } finally {
      setUploadingFiles(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl p-6">Caricamento...</main>;
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error || "Consulto non disponibile"}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <button
        type="button"
        onClick={() => router.push("/professionisti/richieste")}
        className="mb-4 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
      >
        ← Torna ai consulti
      </button>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Cartella condivisa per consulto
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.consult.priority === "emergency" ? (
                  <span className="rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                    EMERGENZA
                  </span>
                ) : null}

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {statusLabel(data.consult.status)}
                </span>

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {data.consult.share_mode === "full_record"
                    ? "Cartella completa"
                    : "Eventi selezionati"}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                {data.consult.animal_name} <span className="text-zinc-400">•</span>{" "}
                <span className="text-zinc-700">{data.consult.subject}</span>
              </h1>

              <p className="mt-2 max-w-3xl text-base leading-7 text-zinc-600">
                Cartella clinica condivisa da {data.consult.sender_display_name} a{" "}
                {data.consult.receiver_display_name}.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Creato il {new Date(data.consult.created_at).toLocaleString("it-IT")} · Scade il{" "}
                {new Date(data.consult.expires_at).toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Animale
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900">
              {animal?.name || data.consult.animal_name || "—"}
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {animal?.species || data.animal?.species || "—"}
              {animal?.breed || data.animal?.breed ? ` • ${animal?.breed || data.animal?.breed}` : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Microchip / Codice
            </div>
            <div className="mt-2 break-all text-base font-semibold text-zinc-900">
              {normalizeChip(animal?.chip_number || data.animal?.chip_number) || "Non disponibile"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Identificazione rapida del paziente condiviso.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Proprietario
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900">
              {animal?.owner_name || data.animal?.owner_name || "Non disponibile"}
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {animal?.owner_email || data.animal?.owner_email || "—"}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Stato clinico rapido</h2>
            <p className="text-sm text-slate-500">
              Riepilogo dinamico derivato dagli eventi condivisi.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Età / Peso
            </div>
            <div className="mt-2 space-y-1 text-sm text-slate-800">
              <div>
                <span className="font-medium">Età:</span> {rapidClinicalState.age}
              </div>
              <div>
                <span className="font-medium">Peso:</span> {rapidClinicalState.weight}
              </div>
              <div>
                <span className="font-medium">Gruppo sanguigno:</span> {rapidClinicalState.bloodType}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Allergie
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.allergies.length > 0 ? (
                rapidClinicalState.allergies.map((item, index) => (
                  <div key={index}>
                    {typeof item === "string"
                      ? item
                      : item.title || item.description || "Allergia registrata"}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Nessuna evidenza negli eventi condivisi</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Terapie attive
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.activeTherapies.length > 0 ? (
                rapidClinicalState.activeTherapies.map((item, index) => (
                  <div key={index}>{item.title || item.description || "Terapia attiva"}</div>
                ))
              ) : (
                <div className="text-slate-500">Nessuna terapia attiva rilevata</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ultime terapie
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.lastTherapies.length > 0 ? (
                rapidClinicalState.lastTherapies.map((item, index) => (
                  <div key={index}>
                    {item.event_date ? `${formatDate(item.event_date)} · ` : ""}
                    {item.title || item.description || "Terapia"}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Nessuna terapia recente</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Patologie croniche
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.chronicPathologies.length > 0 ? (
                rapidClinicalState.chronicPathologies.map((item, index) => (
                  <div key={index}>{item.title || item.description || "Patologia cronica"}</div>
                ))
              ) : (
                <div className="text-slate-500">Nessuna patologia cronica rilevata</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ricontrolli programmati
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.nextRecall ? (
                <div>{rapidClinicalState.nextRecall}</div>
              ) : (
                <div className="text-slate-500">Nessun ricontrollo futuro rilevato</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ultima visita
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.latestVisit ? (
                typeof rapidClinicalState.latestVisit === "string" ? (
                  <div>{rapidClinicalState.latestVisit}</div>
                ) : (
                  <div>
                    {formatDate(rapidClinicalState.latestVisit.date)} ·{" "}
                    {rapidClinicalState.latestVisit.title ||
                      rapidClinicalState.latestVisit.description ||
                      "Visita"}
                  </div>
                )
              ) : (
                <div className="text-slate-500">Nessuna visita rilevata</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ultima vaccinazione
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.latestVaccination ? (
                typeof rapidClinicalState.latestVaccination === "string" ? (
                  <div>{rapidClinicalState.latestVaccination}</div>
                ) : (
                  <div>
                    {formatDate(rapidClinicalState.latestVaccination.date)} ·{" "}
                    {rapidClinicalState.latestVaccination.title ||
                      rapidClinicalState.latestVaccination.description ||
                      "Vaccinazione"}
                  </div>
                )
              ) : (
                <div className="text-slate-500">Nessuna vaccinazione rilevata</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Vaccinazioni in scadenza
            </div>
            <div className="mt-2 text-sm text-slate-800">
              {rapidClinicalState.vaccinationExpiry ? (
                typeof rapidClinicalState.vaccinationExpiry === "string" ? (
                  <div>{rapidClinicalState.vaccinationExpiry}</div>
                ) : (
                  <div>
                    {formatDate(rapidClinicalState.vaccinationExpiry.date)} ·{" "}
                    {rapidClinicalState.vaccinationExpiry.title ||
                      rapidClinicalState.vaccinationExpiry.description ||
                      "Richiamo / scadenza vaccinale"}
                  </div>
                )
              ) : (
                <div className="text-slate-500">
                  Nessuna scadenza vaccinale futura rilevata
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {canAcceptReject ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Azioni</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction("accept")}
              disabled={saving}
              className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Accetta consulto
            </button>

            <button
              type="button"
              onClick={() => runAction("reject")}
              disabled={saving}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
            >
              Rifiuta
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Cartella clinica condivisa</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Vista rapida degli eventi clinici condivisi nel consulto, con filtri e dettaglio
              completo al click.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tutti" },
              { key: "visits", label: "Visite" },
              { key: "therapies", label: "Terapie" },
              { key: "vaccines", label: "Vaccini" },
              { key: "files", label: "Con allegati" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  filter === item.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredSharedEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-600">
              Nessun evento per questo filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSharedEvents.map((event) => {
                const files = Array.isArray(event?.files) ? event.files : [];
                const preview = extractText(event?.description);
                const weightLabel =
                  extractText(event?.weight_kg) ||
                  extractText(event?.weight) ||
                  extractText((event?.payload as { weight?: unknown } | undefined)?.weight) ||
                  extractText((event?.data as { weight?: unknown } | undefined)?.weight);

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {typeLabel(event?.type)}
                          </span>

                          {weightLabel ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              Peso {weightLabel}
                            </span>
                          ) : null}

                          {files.length > 0 ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              Allegati {files.length}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-slate-900 md:text-lg">
                          {event?.title || "Evento clinico"}
                        </h3>

                        <div className="mt-1 text-sm text-slate-500">
                          {formatDateTime(
                            event?.event_date || event?.performed_at || event?.created_at
                          )}
                        </div>

                        {preview ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">
                            {preview}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">
                            Nessuna descrizione disponibile
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-sm font-medium text-slate-600">Apri →</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Messaggi / referto</h2>

          <div className="mt-4 space-y-3">
            {data.messages.map((message) => {
              const mine = message.sender_professional_id === data.currentProfessionalId;
              return (
                <div
                  key={message.id}
                  className={`rounded-2xl p-4 ${mine ? "bg-zinc-100" : "bg-blue-50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-900">
                      {message.sender_display_name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(message.created_at).toLocaleString("it-IT")}
                    </div>
                  </div>

                  <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {message.message_type}
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">
                    {message.message}
                  </div>

                  {Array.isArray(message?.files) && message.files.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {message.files.map((file, index) => {
                        const href = file?.path
                          ? `/api/professionisti/consults/messages/files/download?path=${encodeURIComponent(file.path)}${
                              file.filename ? `&filename=${encodeURIComponent(file.filename)}` : ""
                            }`
                          : null;

                        return href ? (
                          <a
                            key={file.id || `${file.filename || "file"}-${index}`}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          >
                            <span className="truncate">{file.filename || "Allegato"}</span>
                            <span className="ml-3 shrink-0 text-xs text-slate-500">
                              {formatBytes(file.size)}
                            </span>
                          </a>
                        ) : (
                          <div
                            key={file.id || `${file.filename || "file"}-${index}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500"
                          >
                            {file.filename || "Allegato"}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {canReply ? (
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <label className="mb-2 block text-sm font-semibold text-zinc-900">
                Invia risposta / referto
              </label>

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                placeholder="Scrivi il tuo referto o la risposta..."
              />

              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="mb-2">
                  <div className="text-sm font-medium text-slate-800">Allegati risposta</div>
                  <div className="text-xs text-slate-500">
                    Allega PDF, immagini, referti, esami.
                  </div>
                </div>

                <input
                  type="file"
                  multiple
                  onChange={handleReplyFilesChange}
                  className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                />

                {replyFiles.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {replyFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-800">{file.name}</div>
                          <div className="text-xs text-slate-500">{formatBytes(file.size)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeReplyFile(index)}
                          className="ml-3 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Rimuovi
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={sendingReply || sendingReplyFiles}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingReply || sendingReplyFiles
                    ? "Invio in corso..."
                    : "Invia risposta / referto"}
                </button>

                {canClose ? (
                  <button
                    type="button"
                    onClick={() => runAction("close")}
                    disabled={saving}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
                  >
                    Chiudi consulto
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 text-sm font-medium text-slate-500">
                  {typeLabel(selectedEvent?.type)}
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {selectedEvent?.title || "Dettaglio evento"}
                </h2>
                <div className="mt-2 text-sm text-slate-500">
                  {formatDateTime(
                    selectedEvent?.event_date ||
                      selectedEvent?.performed_at ||
                      selectedEvent?.scheduled_for ||
                      selectedEvent?.created_at
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Meta</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Titolo:</span> {selectedEvent?.title || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>{" "}
                    {formatDateTime(
                      selectedEvent?.event_date ||
                        selectedEvent?.performed_at ||
                        selectedEvent?.created_at
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {typeLabel(selectedEvent?.type)}
                  </div>
                  <div>
                    <span className="font-medium">Peso:</span>{" "}
                    {extractText(
                      selectedEvent?.weight_kg ||
                        selectedEvent?.weight ||
                        (selectedEvent?.payload as { weight?: unknown } | undefined)?.weight ||
                        (selectedEvent?.data as { weight?: unknown } | undefined)?.weight
                    ) || "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Allegati evento
                </div>
                <div className="mt-3 space-y-2">
                  {(selectedEvent?.files || []).length > 0 ? (
                    selectedEvent.files.map((file, index) => {
                      const href = buildEventDownloadHref(file);

                      return href ? (
                        <a
                          key={file.id || `${file.filename || "file"}-${index}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        >
                          <span className="truncate">{file.filename || "File allegato"}</span>
                          <span className="ml-3 shrink-0 text-xs text-slate-500">
                            {formatBytes(file.size)}
                          </span>
                        </a>
                      ) : (
                        <div
                          key={file.id || `${file.filename || "file"}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400"
                        >
                          {file.filename || "File allegato"}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500">Nessun allegato presente</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Descrizione completa
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {extractText(selectedEvent?.description) || "Nessuna descrizione disponibile"}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Aggiungi allegati all’evento
                </span>

                <input
                  type="file"
                  multiple
                  className="block w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-zinc-400"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    await uploadEventFiles(selectedEvent.id, files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              {uploadingFiles ? (
                <div className="mt-2 text-xs text-zinc-500">Caricamento allegati…</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}