"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeScanResult } from "@/lib/normalizeScanResult";

type Props = {
  onScan: (code: string) => Promise<void> | void;
  disabled?: boolean;
};

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="loading"
    />
  );
}

export default function UsbScannerMode({ onScan, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [buffer, setBuffer] = useState("");
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  const placeholder = useMemo(
    () => "Collega il lettore USB e scansiona: il codice verrà scritto qui e invierà ENTER.",
    []
  );

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();

    const id = window.setInterval(() => {
      if (!disabled && document.activeElement !== inputRef.current) focus();
    }, 800);

    return () => window.clearInterval(id);
  }, [disabled]);

  async function handleEnter() {
    if (disabled || isProcessingLocal) return;

    const code = normalizeScanResult(buffer);
    if (!code) return;

    try {
      setIsProcessingLocal(true);
      await onScan(code);
    } finally {
      setIsProcessingLocal(false);
      setBuffer("");
      inputRef.current?.focus();
    }
  }

  const busy = disabled || isProcessingLocal;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-sm font-medium">🔫 Lettore esterno (USB)</div>
          {busy ? (
            <div className="text-xs opacity-70 flex items-center gap-2">
              <Spinner />
              <span>in attesa…</span>
            </div>
          ) : null}
        </div>

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
          disabled={busy}
        />

        <div className="text-xs opacity-70 mt-2">
          Stato: {busy ? "elaborazione..." : "in attesa di scansione"}
        </div>
      </div>
    </div>
  );
}