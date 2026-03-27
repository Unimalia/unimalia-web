import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { uploadId, key, partNumber } = await req.json();

  const command = new UploadPartCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 600 });

  return Response.json({ url });
}