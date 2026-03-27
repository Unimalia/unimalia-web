export type MultipartOptions = {
  file: File;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
};

const PART_SIZE = 5 * 1024 * 1024; // 5MB

export async function multipartUpload({ file, onProgress }: MultipartOptions) {
  // STEP 1 — init
  const initRes = await fetch("/api/clinic/imaging/multipart/init", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  const init = await initRes.json();

  const { uploadId, key } = init;

  let uploadedBytes = 0;
  const parts: { ETag: string; PartNumber: number }[] = [];

  const totalParts = Math.ceil(file.size / PART_SIZE);

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);

    const chunk = file.slice(start, end);

    // STEP 2 — sign part
    const signRes = await fetch("/api/clinic/imaging/multipart/sign", {
      method: "POST",
      body: JSON.stringify({
        uploadId,
        key,
        partNumber,
      }),
    });

    const { url } = await signRes.json();

    // STEP 3 — upload chunk
    const uploadRes = await fetch(url, {
      method: "PUT",
      body: chunk,
    });

    if (!uploadRes.ok) throw new Error("Chunk upload failed");

    const etag = uploadRes.headers.get("ETag") || "";

    parts.push({
      ETag: etag.replaceAll('"', ""),
      PartNumber: partNumber,
    });

    uploadedBytes += chunk.size;

    if (onProgress) {
      const percent = Math.round((uploadedBytes / file.size) * 100);
      onProgress(percent);
    }
  }

  // STEP 4 — complete
  await fetch("/api/clinic/imaging/multipart/complete", {
    method: "POST",
    body: JSON.stringify({
      uploadId,
      key,
      parts,
    }),
  });

  return { key };
}