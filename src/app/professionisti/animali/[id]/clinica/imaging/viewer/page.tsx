"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  init as coreInit,
  RenderingEngine,
  Enums,
  type Types,
} from "@cornerstonejs/core";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";

function ViewerInner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const urlParam = searchParams.get("url");

  useEffect(() => {
    let cancelled = false;
    let renderingEngine: RenderingEngine | null = null;

    async function run() {
      if (!containerRef.current) return;
      if (!urlParam) {
        setError("URL DICOM mancante.");
        return;
      }

      try {
        setError(null);

        await coreInit();
        await dicomImageLoaderInit();

        if (cancelled || !containerRef.current) return;

        const element = containerRef.current;
        const renderingEngineId = "unimalia-imaging-rendering-engine";
        const viewportId = "unimalia-imaging-stack-viewport";

        renderingEngine = new RenderingEngine(renderingEngineId);

        const viewportInput: Types.PublicViewportInput = {
          viewportId,
          element,
          type: Enums.ViewportType.STACK,
        };

        renderingEngine.enableElement(viewportInput);

        const viewport = renderingEngine.getViewport(viewportId);

        if (!viewport) {
          throw new Error("Viewport non disponibile.");
        }

        const imageId = `wadouri:${urlParam}`;

        await (viewport as Types.IStackViewport).setStack([imageId], 0);
        viewport.render();
      } catch (err: any) {
        console.error("DICOM VIEWER ERROR:", err);
        if (!cancelled) {
          setError(err?.message || "Errore apertura viewer DICOM.");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      try {
        renderingEngine?.destroy();
      } catch {}
    };
  }, [urlParam]);

  return (
    <div className="h-screen w-full bg-black">
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white">
          {error}
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full" />
      )}
    </div>
  );
}

export default function ImagingViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-black text-sm text-white">
          Caricamento viewer…
        </div>
      }
    >
      <ViewerInner />
    </Suspense>
  );
}