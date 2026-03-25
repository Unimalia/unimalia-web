import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

function assertEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

function getR2Client() {
  assertEnv("CLOUDFLARE_R2_ACCOUNT_ID", R2_ACCOUNT_ID);
  assertEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID);
  assertEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY);

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketName() {
  assertEnv("CLOUDFLARE_R2_BUCKET_NAME", R2_BUCKET_NAME);
  return R2_BUCKET_NAME!;
}

export type UploadPrivateFileInput = {
  path: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
};

export type UploadPrivateFileResult = {
  path: string;
  bucket: string;
};

export type CreateSignedUploadUrlInput = {
  path: string;
  contentType?: string;
  expiresInSeconds?: number;
};

export type CreateSignedUploadUrlResult = {
  url: string;
  path: string;
  bucket: string;
  expiresInSeconds: number;
};

export async function uploadPrivateFile(
  input: UploadPrivateFileInput
): Promise<UploadPrivateFileResult> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.path,
    Body: input.body,
    ContentType: input.contentType ?? "application/octet-stream",
  });

  await client.send(command);

  return {
    path: input.path,
    bucket,
  };
}

export async function createSignedUploadUrl(
  input: CreateSignedUploadUrlInput
): Promise<CreateSignedUploadUrlResult> {
  const client = getR2Client();
  const bucket = getBucketName();
  const expiresInSeconds = input.expiresInSeconds ?? 60 * 15;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.path,
    ContentType: input.contentType ?? "application/octet-stream",
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    url,
    path: input.path,
    bucket,
    expiresInSeconds,
  };
}

export async function createSignedDownloadUrl(
  path: string,
  expiresInSeconds = 60
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}

export async function deletePrivateFile(path: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  await client.send(command);
}

export async function fileExists(path: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

export function getStorageTierForFile(createdAt: Date | string): "hot" | "cold" {
  const createdDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const now = new Date();

  const diffMs = now.getTime() - createdDate.getTime();
  const sixMonthsMs = 1000 * 60 * 60 * 24 * 30 * 6;

  return diffMs <= sixMonthsMs ? "hot" : "cold";
}