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

  const initResp = await fetch("/api/clinic/imaging/multipart/init", {
    method: "POST",
    headers,
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      animalId,
      modality,
      bodyPart,
    }),
  });

  const init = await initResp.json();

  if (!initResp.ok) throw new Error(init?.error);

  const { uploadId, key, totalParts, resumed } = init;

  localStorage.setItem(localKey, uploadId);

  onStatus?.(resumed ? "Resume upload..." : "New upload...");

  // 🔥 status
  const statusResp = await fetch(
    `/api/clinic/imaging/multipart/status?uploadId=${uploadId}`,
    {
      headers: await authHeaders(),
    }
  );

  const status = await statusResp.json();

  const uploadedParts = new Set<number>(
    status?.uploadedPartNumbers || []
  );

  for (let part = 1; part <= totalParts; part++) {
    if (uploadedParts.has(part)) continue;

    onStatus?.(`Chunk ${part}/${totalParts}`);

    const start = (part - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);

    const chunk = file.slice(start, end);

    const urlResp = await fetch(
      `/api/clinic/imaging/multipart/part-url?uploadId=${uploadId}&partNumber=${part}&key=${encodeURIComponent(
        key
      )}`,
      { headers: await authHeaders() }
    );

    const { url } = await urlResp.json();

    const uploadResp = await retryFetch(() =>
      fetch(url, { method: "PUT", body: chunk })
    );

    const etag = uploadResp.headers.get("etag") || "";

    await fetch("/api/clinic/imaging/multipart/mark-part", {
      method: "POST",
      headers,
      body: JSON.stringify({ uploadId, partNumber: part, etag }),
    });

    const percent = Math.round((part / totalParts) * 100);
    onProgress?.(percent);
  }

  onStatus?.("Completing...");

  const completeResp = await fetch(
    "/api/clinic/imaging/multipart/complete",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ uploadId, key }),
    }
  );

  const complete = await completeResp.json();

  if (!completeResp.ok) throw new Error(complete?.error);

  localStorage.removeItem(localKey);

  onStatus?.("Done");

  return complete;
}