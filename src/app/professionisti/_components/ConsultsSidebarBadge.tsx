"use client";

import { useEffect, useState } from "react";

export default function ConsultsSidebarBadge() {
  const [count, setCount] = useState(0);

  async function loadCount() {
    try {
      const res = await fetch("/api/professionisti/consults?box=received", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        setCount(0);
        return;
      }

      setCount(Array.isArray(json.items) ? json.items.length : 0);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    loadCount();
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-2 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
      {count}
    </span>
  );
}