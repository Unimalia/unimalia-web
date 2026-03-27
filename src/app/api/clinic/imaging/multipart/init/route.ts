import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { fileName, fileType } = await req.json();

  const key = `imaging/${Date.now()}-${fileName}`;

  const res = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      ContentType: fileType,
    })
  );

  return Response.json({
    uploadId: res.UploadId,
    key,
  });
}