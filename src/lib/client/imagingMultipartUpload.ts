type MultipartUploadParams = {
  file: File;
  animalId: string;
  modality?: string | null;
  bodyPart?: string | null;
  onProgress?: (percent: number) => void;
  onStatus?: (msg: string) => void;
};

export async function multipartUpload({
  file,
  animalId,
  modality,
  bodyPart,
  onProgress,
  onStatus,
}: MultipartUploadParams) {
  const token = localStorage.getItem("sb-access-token");

  if (!token) throw new Error("Missing auth token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 🔥 INIT
  onStatus?.("Init upload...");

  const initResp = await fetch("/api/clinic/imaging/multipart/init", {
    method: "POST",
    headers,
    body: JSON.stringify({
      animalId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: null, // server prende da token
    }),
  });

  const initJson = await initResp.json();

  if (!initJson.ok) throw new Error(initJson.error);

  const { sessionId, partSize, totalParts } = initJson.data;

  // 🔥 STATUS (resume)
  onStatus?.("Checking existing upload...");

  const statusResp = await fetch("/api/clinic/imaging/multipart/status", {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId }),
  });

  const statusJson = await statusResp.json();

  const uploadedParts = statusJson.data?.uploadedPartNumbers || [];

  let uploadedBytes = statusJson.data?.uploadedBytes || 0;

  // 🔁 LOOP CHUNK
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    if (uploadedParts.includes(partNumber)) continue;

    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    onStatus?.(`Uploading part ${partNumber}/${totalParts}`);

    // 🔐 SIGN URL
    const signResp = await fetch("/api/clinic/imaging/multipart/sign", {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId, partNumber }),
    });

    const signJson = await signResp.json();

    if (!signJson.ok) throw new Error(signJson.error);

    const { url } = signJson.data;

    // 🔁 RETRY LOGIC
    let uploaded = false;
    let attempt = 0;

    while (!uploaded && attempt < 3) {
      attempt++;

      try {
        const uploadResp = await fetch(url, {
          method: "PUT",
          body: chunk,
        });

        if (!uploadResp.ok) throw new Error("Chunk upload failed");

        const etag = uploadResp.headers.get("etag") || `${Date.now()}`;

        // 🔥 MARK PART
        await fetch("/api/clinic/imaging/multipart/mark-part", {
          method: "POST",
          headers,
          body: JSON.stringify({
            sessionId,
            partNumber,
            etag,
            size: chunk.size,
          }),
        });

        uploaded = true;
      } catch (err) {
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }

    uploadedBytes += chunk.size;

    const percent = Math.round((uploadedBytes / file.size) * 100);
    onProgress?.(percent);
  }

  // 🔥 COMPLETE
  onStatus?.("Finalizing upload...");

  const completeResp = await fetch("/api/clinic/imaging/multipart/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({
      sessionId,
      animalId,
      modality,
      bodyPart,
    }),
  });

  const completeJson = await completeResp.json();

  if (!completeJson.ok) throw new Error(completeJson.error);

  onProgress?.(100);
  onStatus?.("Upload completed");

  return completeJson.data;
}