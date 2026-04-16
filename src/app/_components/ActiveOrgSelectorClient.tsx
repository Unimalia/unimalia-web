"use client";

import { useState } from "react";

type Item = { organizationId: string; organizationName: string };

export default function ActiveOrgSelectorClient({
  memberships,
  activeOrgId,
}: {
  memberships: Item[];
  activeOrgId: string;
}) {
  const [value, setValue] = useState(activeOrgId);
  const [loading, setLoading] = useState(false);

  async function onChange(nextId: string) {
    setValue(nextId);
    setLoading(true);
    try {
      const res = await fetch("/api/organizations/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: nextId }),
      });

      if (!res.ok) {
        setValue(activeOrgId);
        alert("Non hai i permessi per selezionare questa clinica.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-80">Stai operando per:</span>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        aria-label="Seleziona clinica attiva"
      >
        {memberships.map((m) => (
          <option key={m.organizationId} value={m.organizationId}>
            {m.organizationName}
          </option>
        ))}
      </select>
    </div>
  );
}