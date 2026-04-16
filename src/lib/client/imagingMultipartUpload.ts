import { authHeaders } from "@/lib/client/authHeaders";

const PART_SIZE = 5 * 1024 * 1024;

type Params = {
  file: File;
  animalId: string;
  finalPath: string;
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
  finalPath,
  modality,
  bodyPart,
  onProgress,
  onStatus,
}: Params) {
  const localKey = getLocalKey(file, animalId);

  onStatus?.("Init upload...");

  const initHeaders = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const initResp = await fetch("/api/clinic/imaging/multipart/init", {
    method: "POST",
    headers: initHeaders,
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      animalId,
      modality,
      bodyPart,
      finalPath,
    }),
  });

  const init = await safeJson(initResp);

  if (!initResp.ok || !init?.uploadId || !init?.key || !init?.totalParts) {
    throw new Error(init?.error || "Init upload failed");
  }

  const uploadId = String(init.uploadId);
  const key = String(init.key);
  const totalParts = Number(init.totalParts);
  const resumed = Boolean(init.resumed);

  localStorage.setItem(localKey, uploadId);

  onStatus?.(resumed ? "Resume upload..." : "New upload...");

  const statusResp = await fetch(
    `/api/clinic/imaging/multipart/status?uploadId=${encodeURIComponent(uploadId)}`,
    {
      headers: await authHeaders(),
    }
  );

  const status = await safeJson(statusResp);

  if (!statusResp.ok) {
    throw new Error(status?.error || "Status upload failed");
  }

  const uploadedParts = new Set<number>(Array.isArray(status?.uploadedPartNumbers) ? status.uploadedPartNumbers : []);

  for (let part = 1; part <= totalParts; part++) {
    if (uploadedParts.has(part)) continue;

    onStatus?.(`Chunk ${part}/${totalParts}`);

    const start = (part - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const chunk = file.slice(start, end);

    const partUrlResp = await fetch(
      `/api/clinic/imaging/multipart/part-url?uploadId=${encodeURIComponent(
        uploadId
      )}&partNumber=${part}&key=${encodeURIComponent(key)}`,
      {
        headers: await authHeaders(),
      }
    );

    const partUrlJson = await safeJson(partUrlResp);

    if (!partUrlResp.ok || !partUrlJson?.url) {
      throw new Error(partUrlJson?.error || "Errore part-url");
    }

    const uploadUrl = String(partUrlJson.url);

    const uploadResp = await retryFetch(() =>
      fetch(uploadUrl, {
        method: "PUT",
        body: chunk,
      })
    );

    const etag = uploadResp.headers.get("etag") || "";

    const markHeaders = {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    };

    const markResp = await fetch("/api/clinic/imaging/multipart/mark-part", {
      method: "POST",
      headers: markHeaders,
      body: JSON.stringify({
        uploadId,
        partNumber: part,
        etag,
      }),
    });

    const markJson = await safeJson(markResp);

    if (!markResp.ok) {
      throw new Error(markJson?.error || "Errore mark-part");
    }

    const percent = Math.round((part / totalParts) * 100);
    onProgress?.(percent);
  }

  onStatus?.("Completing...");

  const completeHeaders = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const completeResp = await fetch("/api/clinic/imaging/multipart/complete", {
    method: "POST",
    headers: completeHeaders,
    body: JSON.stringify({
      uploadId,
      animalId,
      key,
    }),
  });

  const complete = await safeJson(completeResp);

  if (!completeResp.ok || !complete?.ok) {
    throw new Error(complete?.error || "Complete upload failed");
  }

  localStorage.removeItem(localKey);

  onStatus?.("Upload completato");

  return complete;
}