"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeScanResult } from "@/lib/normalizeScanResult";

type Props = {
  onScan: (code: string) => Promise<void> | void;
};

export default function UsbScannerMode({ onScan }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [buffer, setBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const placeholder = useMemo(
    () => "Collega il lettore USB e scansiona: il codice verrà scritto qui e invierà ENTER.",
    []
  );

  // Focus automatico + “anti-perdita focus”
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();

    const id = window.setInterval(() => {
      if (document.activeElement !== inputRef.current) focus();
    }, 800);

    return () => window.clearInterval(id);
  }, []);

  async function handleEnter() {
    const code = normalizeScanResult(buffer);
    if (!code || isProcessing) return;

    try {
      setIsProcessing(true);
      await onScan(code);
    } finally {
      setIsProcessing(false);
      setBuffer("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-medium mb-2">🔫 Lettore esterno (USB)</div>

        <input
          ref={inputRef}
          className="w-full rounded-xl border px-3 py-2 outline-none"
          placeholder={placeholder}
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleEnter();
            }
          }}
          onBlur={() => inputRef.current?.focus()}
          inputMode="none"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="text-xs opacity-70 mt-2">
          Stato: {isProcessing ? "elaborazione..." : "in attesa di scansione"}
        </div>
      </div>
    </div>
  );
}