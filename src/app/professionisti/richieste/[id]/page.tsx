"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authHeaders } from "@/lib/client/authHeaders";

type FilterKey =
  | "all"
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "weight"
  | "surgery"
  | "chronic_condition"
  | "follow_up";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tutti" },
  { key: "visit", label: "Visite" },
  { key: "vaccine", label: "Vaccini" },
  { key: "exam", label: "Esami" },
  { key: "therapy", label: "Terapie" },
  { key: "chronic_condition", label: "Patologie croniche" },
  { key: "follow_up", label: "Ricontrolli" },
  { key: "surgery", label: "Chirurgia" },
  { key: "note", label: "Note" },
  { key: "document", label: "Documenti" },
  { key: "weight", label: "Peso" },
];

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
    created_at?: string | null;
    meta?: any;
    files: Array<{
      id: string;
      filename: string | null;
      path?: string | null;
      mime: string | null;
      size: number | null;
      created_at?: string | null;
    }>;
  }>;
};

type AnimalSummary = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  chip_number?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
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

function typeIcon(t?: string | null) {
  switch (t) {
    case "visit":
      return "🩺";
    case "vaccine":
      return "💉";
    case "exam":
      return "🔬";
    case "therapy":
      return "💊";
    case "surgery":
      return "🏥";
    case "note":
      return "📝";
    case "chronic_condition":
      return "📌";
    case "follow_up":
      return "🔁";
    default:
      return "📄";
  }
}

function eventTypeDisplay(t?: string | null) {
  return `${typeIcon(t)} ${typeLabel(t)}`;
}

function extractWeightKg(e: any): number | null {
  if (!e) return null;

  const direct =
    e.weight_kg ??
    e.weightKg ??
    e?.meta?.weight_kg ??
    e?.meta?.weightKg ??
    e?.data?.weightKg ??
    e?.data?.weight_kg ??
    e?.payload?.weightKg ??
    e?.payload?.weight_kg;

  if (direct === null || direct === undefined) return null;

  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n * 10) / 10;
}

function formatWeightLabel(kg: number) {
  return Number.isInteger(kg) ? `${kg} kg` : `${kg} kg`;
}

function formatEventDateIT(dateStr?: string | null) {
  if (!dateStr) return "—";

  const s = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return new Date(s).toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInsertedAtIT(iso?: string | null) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeChip(raw?: string | null) {
  return String(raw || "").replace(/\s+/g, "").trim();
}

function eventDateTs(e: { event_date?: string | null; created_at?: string | null }) {
  const source = e.event_date || e.created_at || "";
  const ts = source ? new Date(source).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
}

function sortDescByDate<T extends { event_date?: string | null; created_at?: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => eventDateTs(b) - eventDateTs(a));
}

function inferAllergies(events: ConsultDetail["events"]) {
  return sortDescByDate(events)
    .filter((e) => {
      const text = `${e.title || ""} ${e.description || ""}`.toLowerCase();
      return text.includes("allerg");
    })
    .slice(0, 5)
    .map((e) => ({
      label: e.title || e.description || "Allergia",
      date: e.event_date || e.created_at || null,
    }));
}

function inferActiveTherapies(events: ConsultDetail["events"]) {
  const now = Date.now();

  return sortDescByDate(events)
    .filter((e) => e.type === "therapy")
    .filter((e) => {
      const endDate =
        e?.meta?.therapy_end_date ||
        e?.meta?.therapyEndDate ||
        null;

      if (!endDate) return true;

      const ts = new Date(endDate).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts >= now;
    })
    .slice(0, 5)
    .map((e) => ({
      label: e.description || e.title || "Terapia attiva",
      date: e.event_date || e.created_at || null,
    }));
}

function inferRecentTherapies(events: ConsultDetail["events"]) {
  return sortDescByDate(events)
    .filter((e) => e.type === "therapy")
    .slice(0, 5)
    .map((e) => ({
      label: e.description || e.title || "Terapia",
      date: e.event_date || e.created_at || null,
    }));
}

function inferChronicConditions(events: ConsultDetail["events"]) {
  return sortDescByDate(events)
    .filter((e) => e.type === "chronic_condition")
    .slice(0, 5)
    .map((e) => ({
      label: e.title || e.description || "Patologia cronica",
      date: e.event_date || e.created_at || null,
    }));
}

function inferFollowUps(events: ConsultDetail["events"]) {
  return sortDescByDate(events)
    .filter((e) => e.type === "follow_up")
    .slice(0, 5)
    .map((e) => ({
      label: e.title || e.description || "Ricontrollo",
      date: e.event_date || e.created_at || null,
    }));
}

function findLatestByType(events: ConsultDetail["events"], type: string) {
  return sortDescByDate(events).find((e) => e.type === type) ?? null;
}

function findExpiringVaccines(events: ConsultDetail["events"]) {
  const now = Date.now();
  const in30Days = now + 30 * 24 * 60 * 60 * 1000;

  return sortDescByDate(events)
    .filter((e) => e.type === "vaccine")
    .map((e) => {
      const due =
        e?.meta?.next_due_date ||
        e?.meta?.nextDueDate ||
        null;

      return {
        event: e,
        due,
      };
    })
    .filter((x) => !!x.due)
    .filter((x) => {
      const ts = new Date(String(x.due)).getTime();
      return Number.isFinite(ts) && ts <= in30Days;
    })
    .slice(0, 5);
}

function buildDownloadHref(file: { path?: string | null; filename?: string | null }) {
  if (!file?.path) return null;

  const params = new URLSearchParams({
    path: file.path,
  });

  if (file.filename) {
    params.set("filename", file.filename);
  }

  return `/api/clinic-events/files/download?${params.toString()}`;
}

export default function ProfessionistiRichiestaDettaglioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ConsultDetail | null>(null);
  const [animal, setAnimal] = useState<AnimalSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  async function load(keepSelectedEventId?: string | null) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Errore caricamento consulto");

      setData(json);

      const animalId = json?.consult?.animal_id;
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
            const animalJson = await animalRes.json().catch(() => ({}));
            const a = animalJson?.animal || null;

            setAnimal(
              a
                ? {
                    id: a.id,
                    name: a.name ?? null,
                    species: a.species ?? null,
                    breed: a.breed ?? null,
                    chip_number: a.chip_number ?? a.chip_code ?? null,
                    owner_name: a.owner_name ?? null,
                    owner_email: a.owner_email ?? null,
                  }
                : null
            );
          } else {
            setAnimal(null);
          }
        } catch {
          setAnimal(null);
        }
      } else {
        setAnimal(null);
      }

      if (keepSelectedEventId) {
        const refreshedEvent =
          (json?.events as ConsultDetail["events"])?.find((e) => e.id === keepSelectedEventId) ??
          null;
        setSelectedEventId(refreshedEvent?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const selectedEvent = useMemo(() => {
    if (!data || !selectedEventId) return null;
    return data.events.find((e) => e.id === selectedEventId) ?? null;
  }, [data, selectedEventId]);

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

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    const q = search.trim().toLowerCase();

    let base = (() => {
      if (filter === "all") return data.events;
      if (filter === "document") {
        return data.events.filter((e) => (e.files?.length ?? 0) > 0);
      }
      if (filter === "weight") {
        return data.events.filter((e) => extractWeightKg(e) !== null);
      }
      return data.events.filter((e) => e.type === filter);
    })();

    if (!q) return base;

    return base.filter((e) => {
      const haystack = [
        e.title,
        e.description,
        e.type,
        e.visibility,
        e.status,
        eventTypeDisplay(e.type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [data, filter, search]);

  const quickStatus = useMemo(() => {
    if (!data) return null;

    const events = data.events;
    const latestWeightEvent = sortDescByDate(events).find((e) => extractWeightKg(e) !== null) ?? null;
    const latestWeight = latestWeightEvent ? extractWeightKg(latestWeightEvent) : null;

    const allergies = inferAllergies(events);
    const activeTherapies = inferActiveTherapies(events);
    const recentTherapies = inferRecentTherapies(events);
    const chronicConditions = inferChronicConditions(events);
    const followUps = inferFollowUps(events);
    const latestVisit = findLatestByType(events, "visit");
    const latestVaccine = findLatestByType(events, "vaccine");
    const expiringVaccines = findExpiringVaccines(events);

    return {
      latestWeight,
      latestWeightDate: latestWeightEvent?.event_date || latestWeightEvent?.created_at || null,
      allergies,
      activeTherapies,
      recentTherapies,
      chronicConditions,
      followUps,
      latestVisit,
      latestVaccine,
      expiringVaccines,
    };
  }, [data]);

  async function runAction(action: "accept" | "reject" | "close") {
    try {
      setSaving(true);

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore aggiornamento consulto");

      await load(selectedEventId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    try {
      setSaving(true);

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", message: reply }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore invio risposta");

      setReply("");
      await load(selectedEventId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
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

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Errore caricamento allegati");
      }

      await load(eventId);
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
              {animal?.species || "—"}
              {animal?.breed ? ` • ${animal.breed}` : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Microchip / Codice
            </div>
            <div className="mt-2 break-all text-base font-semibold text-zinc-900">
              {normalizeChip(animal?.chip_number) || "Non disponibile"}
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
              {animal?.owner_name || "Non disponibile"}
            </div>
            <div className="mt-1 text-sm text-zinc-600">{animal?.owner_email || "—"}</div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Stato clinico rapido</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-700">Età / Peso</div>
            <div className="mt-2 text-sm text-zinc-600">
              Età: — | Peso:{" "}
              {quickStatus?.latestWeight !== null && quickStatus?.latestWeight !== undefined
                ? formatWeightLabel(quickStatus.latestWeight)
                : "—"}
              {quickStatus?.latestWeightDate
                ? ` • ${formatEventDateIT(quickStatus.latestWeightDate)}`
                : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-700">Allergie</div>
            {quickStatus?.allergies?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.allergies.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    {item.label} {item.date ? `• ${formatEventDateIT(item.date)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-700">Terapie attive</div>
            {quickStatus?.activeTherapies?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.activeTherapies.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    {item.label} {item.date ? `• ${formatEventDateIT(item.date)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-700">Ultime terapie</div>
            {quickStatus?.recentTherapies?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.recentTherapies.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    {item.label} {item.date ? `• ${formatEventDateIT(item.date)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-700">Patologie croniche</div>
            {quickStatus?.chronicConditions?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.chronicConditions.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    {item.label} {item.date ? `• ${formatEventDateIT(item.date)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-700">Ricontrolli programmati</div>
            {quickStatus?.followUps?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.followUps.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    {item.label} {item.date ? `• ${formatEventDateIT(item.date)}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-700">Ultima visita</div>
            <div className="mt-2 text-sm text-zinc-600">
              {quickStatus?.latestVisit
                ? formatEventDateIT(quickStatus.latestVisit.event_date || quickStatus.latestVisit.created_at)
                : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-700">Ultima vaccinazione</div>
            <div className="mt-2 text-sm text-zinc-600">
              {quickStatus?.latestVaccine
                ? formatEventDateIT(
                    quickStatus.latestVaccine.event_date || quickStatus.latestVaccine.created_at
                  )
                : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-700">
              Vaccinazioni scadute / in scadenza
            </div>
            {quickStatus?.expiringVaccines?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                {quickStatus.expiringVaccines.map((item, idx) => (
                  <li key={`${item.event.id}-${idx}`}>
                    {(item.event.title || "Vaccinazione")} • {formatEventDateIT(item.due)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-zinc-600">—</div>
            )}
          </div>
        </div>
      </section>

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

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-700">
                Eventi condivisi: <span className="font-semibold">{data.events.length}</span> •
                Filtrati: <span className="font-semibold">{filteredEvents.length}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      className={
                        active
                          ? "rounded-full border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                      }
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                placeholder="Cerca in titolo, descrizione, tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-600">
                Anteprima breve: apri l’evento per leggere tutto e gestire gli allegati.
              </div>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-600">
              Nessun evento per questo filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const kg = extractWeightKg(event);
                const hasFiles = (event.files?.length ?? 0) > 0;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className="block w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                            {eventTypeDisplay(event.type)}
                          </span>

                          <span className="font-medium text-zinc-700">
                            {formatEventDateIT(event.event_date)}
                          </span>

                          {event.created_at ? (
                            <span className="text-zinc-400">
                              • Inserito il {formatInsertedAtIT(event.created_at)}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {kg !== null ? (
                            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              ⚖ {formatWeightLabel(kg)}
                            </span>
                          ) : null}

                          {hasFiles ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              📎 {event.files.length} allegati
                            </span>
                          ) : null}

                          {event.visibility ? (
                            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                              {event.visibility}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 text-base font-semibold leading-6 text-zinc-900">
                          {event.title || typeLabel(event.type)}
                        </div>

                        {event.description ? (
                          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-zinc-700">
                            {event.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-xs font-semibold text-zinc-500">
                        Apri →
                      </div>
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
            {data.messages.map((msg) => {
              const mine = msg.sender_professional_id === data.currentProfessionalId;
              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-4 ${mine ? "bg-zinc-100" : "bg-blue-50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-900">
                      {msg.sender_display_name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(msg.created_at).toLocaleString("it-IT")}
                    </div>
                  </div>

                  <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {msg.message_type}
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">
                    {msg.message}
                  </div>
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

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={saving}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Invia risposta
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

              <p className="mt-3 text-xs text-zinc-500">
                Allegati al consulto: per ora puoi aggiungerli ai singoli eventi condivisi aprendo
                il dettaglio evento qui a sinistra.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold leading-6 text-zinc-900">
                    {selectedEvent.title || typeLabel(selectedEvent.type)}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      {eventTypeDisplay(selectedEvent.type)}
                    </span>
                    <span>{formatEventDateIT(selectedEvent.event_date)}</span>
                  </div>

                  {extractWeightKg(selectedEvent) !== null ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                        ⚖ {formatWeightLabel(extractWeightKg(selectedEvent)!)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  onClick={() => setSelectedEventId(null)}
                >
                  Chiudi
                </button>
              </div>

              <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm">
                {selectedEvent.description ? (
                  <div>
                    <div className="text-xs font-semibold text-zinc-700">Descrizione</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                      {selectedEvent.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
                    Nessuna descrizione disponibile.
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-700">Allegati</div>

                  {selectedEvent.files.length === 0 ? (
                    <div className="mt-2 text-xs text-zinc-600">Nessun allegato.</div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {selectedEvent.files.map((file) => {
                        const href = buildDownloadHref(file);

                        return href ? (
                          <li key={file.id}>
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                            >
                              📎 {file.filename || "File allegato"}
                            </a>
                          </li>
                        ) : (
                          <li
                            key={file.id}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
                          >
                            📎 {file.filename || "File allegato"}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <label className="mt-4 block">
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
                      }}
                    />
                  </label>

                  {uploadingFiles ? (
                    <div className="mt-2 text-xs text-zinc-500">Caricamento allegati…</div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-700">Meta informazioni</div>

                  <div className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-600">
                    <div>
                      ID evento: <span className="font-mono">{selectedEvent.id}</span>
                    </div>
                    <div>Visibilità: {selectedEvent.visibility || "—"}</div>
                    <div>Stato: {selectedEvent.status || "—"}</div>
                    <div>Priorità: {selectedEvent.priority || "—"}</div>
                    {selectedEvent.created_at ? (
                      <div>Inserito il: {formatInsertedAtIT(selectedEvent.created_at)}</div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  onClick={() => setSelectedEventId(null)}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}