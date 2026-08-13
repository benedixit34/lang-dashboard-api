import { PutObjectCommand, ListObjectsV2Command, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const s3 = new S3Client({
  endpoint: getEnv("B2_ENDPOINT"),
  region: getEnv("B2_REGION"),

  credentials: {
    accessKeyId: getEnv("B2_KEY_ID"),
    secretAccessKey: getEnv("B2_APPLICATION_KEY"),
  },
    requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export async function uploadToBackblaze(
  buffer: Buffer,
  key: string,
  contentType?: string,
) {
  const bucket = process.env.B2_BUCKET_NAME;
  const endpoint = process.env.B2_ENDPOINT;

  if (!bucket) {
    throw new Error("B2_BUCKET_NAME is not configured");
  }

  if (!endpoint) {
    throw new Error("B2_ENDPOINT is not configured");
  }

   if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error(`Empty or invalid buffer for ${key}`);
  }

  console.log("Uploading:", {
    key,
    size: buffer.length,
    contentType,
  });


  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentLength: buffer.length,
        ContentType: contentType,
      }),
    );

    return `${endpoint}/${bucket}/${key}`;
  } catch (error: any) {
    console.error("Backblaze upload error:", error);
    throw new Error("Failed to upload file to Backblaze");
  }
}


export async function listImagesFromBackblaze() {
  const bucket = getEnv("B2_BUCKET_NAME");

  const images: {
    key: string;
    url: string;
  }[] = [];

  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key) {
        continue;
      }

      const extension = object.Key
        .split(".")
        .pop()
        ?.toLowerCase();

      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
      ];

      if (!extension || !imageExtensions.includes(extension)) {
        continue;
      }

      images.push({
        key: object.Key,
        url: `${getEnv("B2_ENDPOINT")}/${bucket}/${object.Key}`,
      });
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return images;
}



export async function deleteImageFromBackblaze(
  key: string,
) {
  const bucket = getEnv("B2_BUCKET_NAME");

  if (!key.trim()) {
    throw new Error("Image key is required");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  return true;
}