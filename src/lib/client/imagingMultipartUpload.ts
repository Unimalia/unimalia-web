import { authHeaders } from "@/lib/client/authHeaders";

const PART_SIZE = 5 * 1024 * 1024;

type Params = {
  file: File;
  animalId: string;
  modality?: string | null;
  bodyPart?: string | null;
  onProgress?: (p: number) => void;
  onStatus?: (s: string) => void;
};

function getLocalKey(file: File, animalId: string) {
  return `upload:${animalId}:${file.name}:${file.size}`;
}

async function safeJson(res: Response) {
  try {
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function retryFetch(fn: () => Promise<Response>, retries = 3) {
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      if (res.ok) return res;
    } catch {}

    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }

  throw new Error("Retry failed");
}

export async function multipartUpload({
  file,
  animalId,
  modality,
  bodyPart,
  onProgress,
  onStatus,
}: Params) {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const localKey = getLocalKey(file, animalId);

  onStatus?.("Init upload...");

  // INIT (start or resume)
  const initResp = await fetch("/api/clinic/imaging/multipart/init", {
    method: "POST",
    headers,
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      animalId,
      modality,
      bodyPart,
    }),
  });

  const init = await safeJson(initResp);

  if (!initResp.ok || !init) {
    throw new Error("Init upload failed");
  }

  const { uploadId, key, totalParts, resumed } = init;

  localStorage.setItem(localKey, uploadId);

  onStatus?.(resumed ? "Resume upload..." : "New upload...");

  // STATUS (per resume reale)
  const statusResp = await fetch(
    `/api/clinic/imaging/multipart/status?uploadId=${uploadId}`,
    {
      headers: await authHeaders(),
    }
  );

  const status = await safeJson(statusResp);

  const uploadedParts = new Set<number>(
    status?.uploadedPartNumbers || []
  );

  // LOOP PARTS
  for (let part = 1; part <= totalParts; part++) {
    if (uploadedParts.has(part)) continue;

    onStatus?.(`Chunk ${part}/${totalParts}`);

    const start = (part - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);

    const chunk = file.slice(start, end);

    // GET SIGNED URL
    const urlResp = await fetch(
      `/api/clinic/imaging/multipart/part-url?uploadId=${uploadId}&partNumber=${part}&key=${encodeURIComponent(
        key
      )}`,
      {
        headers: await authHeaders(),
      }
    );

    const urlJson = await safeJson(urlResp);

    if (!urlResp.ok || !urlJson?.url) {
      throw new Error("Errore part-url");
    }

    const uploadUrl = urlJson.url as string;

    // UPLOAD CHUNK (retry)
    const uploadResp = await retryFetch(() =>
      fetch(uploadUrl, {
        method: "PUT",
        body: chunk,
      })
    );

    const etag = uploadResp.headers.get("etag") || "";

    // MARK PART
    await fetch("/api/clinic/imaging/multipart/mark-part", {
      method: "POST",
      headers,
      body: JSON.stringify({
        uploadId,
        partNumber: part,
        etag,
      }),
    });

    const percent = Math.round((part / totalParts) * 100);
    onProgress?.(percent);
  }

  onStatus?.("Completing...");

  // COMPLETE
  const completeResp = await fetch(
    "/api/clinic/imaging/multipart/complete",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        uploadId,
        key,
      }),
    }
  );

  const complete = await safeJson(completeResp);

  if (!completeResp.ok || !complete) {
    throw new Error("Complete upload failed");
  }

  localStorage.removeItem(localKey);

  onStatus?.("Upload completato");

  return complete;
}