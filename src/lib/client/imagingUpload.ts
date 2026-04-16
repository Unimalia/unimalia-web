export type UploadSpeed = "fast" | "balanced" | "slow";

function getChunkSize(speed: UploadSpeed) {
  switch (speed) {
    case "slow":
      return 256 * 1024; // 256 KB
    case "balanced":
      return 1024 * 1024; // 1 MB
    case "fast":
    default:
      return 5 * 1024 * 1024; // 5 MB
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function uploadWithProgress(
  file: File,
  uploadUrl: string,
  speed: UploadSpeed,
  onProgress: (percent: number) => void
) {
  const chunkSize = getChunkSize(speed);
  const total = file.size;

  let uploaded = 0;

  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize, total);
    const chunk = file.slice(start, end);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: chunk,
    });

    if (!res.ok) {
      throw new Error("Errore upload chunk");
    }

    uploaded += chunk.size;

    const percent = Math.round((uploaded / total) * 100);
    onProgress(percent);

    // throttle base
    if (speed !== "fast") {
      await sleep(speed === "slow" ? 200 : 50);
    }
  }
}
