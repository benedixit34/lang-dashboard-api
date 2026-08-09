import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import dotenv from 'dotenv'
dotenv.config()

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`,
    );
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
});

export async function uploadToBackblaze(
  buffer: Buffer,
  key: string,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;
}