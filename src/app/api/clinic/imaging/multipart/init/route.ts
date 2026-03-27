const key = `imaging/${Date.now()}-${fileName}`;

const partSize = 5 * 1024 * 1024;
const totalParts = Math.ceil(fileSize / partSize);

// crea multipart su R2
// crea record DB

return {
  sessionId,
  uploadId,
  key,
  partSize,
  totalParts
};