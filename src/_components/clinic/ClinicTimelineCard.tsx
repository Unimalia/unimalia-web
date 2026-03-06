"use client";

import { formatEventDateIT, formatInsertedAtIT } from "@/lib/clinic/format";
import { extractWeightKg, extractCreatedByMemberLabel } from "@/lib/clinic/meta";

export type ClinicTimelineCardEvent = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  event_date: string;
  created_at?: string | null;
  visibility?: string;
  source?: string;
  verified_at?: string | null;
  verified_by_label?: string | null;
  meta?: any;
};

export function ClinicTimelineCard({
  ev,
  onClick,
}: {
  ev: ClinicTimelineCardEvent;
  onClick: () => void;
}) {
  const weight = extractWeightKg(ev);
  const isVerified = ev.source === "professional" || !!ev.verified_at;

  let top = "";
  let badge = "";

  if (ev.source === "owner") {
    top = "Creato da proprietario";
    if (ev.verified_at && ev.verified_by_label) badge = `✓ Validato da ${ev.verified_by_label}`;
    else if (ev.verified_at) badge = "✓ Validato";
    else badge = "⏳ Da validare";
  } else {
    top = `Registrato da ${extractCreatedByMemberLabel(ev) || "professionista"}`;
    badge = isVerified ? "✓ Validato" : "⏳ Da rivalidare";
  }

  return (
    <div
      className="rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:border-zinc-400"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500">
            <div>Evento: {formatEventDateIT(ev.event_date)}</div>
            {ev.created_at ? <div className="text-zinc-400">Inserito il {formatInsertedAtIT(ev.created_at)}</div> : null}
          </div>

          <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
            {ev.title}
            {weight !== null ? <span className="ml-2 text-xs font-semibold text-zinc-700">⚖ {weight} kg</span> : null}
          </div>

          {ev.description ? <p className="mt-2 text-sm text-zinc-700 line-clamp-2">{ev.description}</p> : null}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {ev.visibility ? (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              {ev.visibility}
            </span>
          ) : null}

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-zinc-600">{top}</span>

            <span
              className={
                isVerified
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}