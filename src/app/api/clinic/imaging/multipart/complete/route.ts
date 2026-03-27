import {
  S3Client,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { uploadId, key, parts } = await req.json();

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    })
  );

  return Response.json({ ok: true });
}