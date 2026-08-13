import "dotenv/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: process.env.B2_REGION!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const buffer = Buffer.from("Hello Backblaze");

console.log("Buffer size:", buffer.length);

try {
  const result = await client.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: "test/hello.txt",
      Body: buffer,
      ContentLength: buffer.length,
      ContentType: "text/plain",
    }),
  );

  console.log("SUCCESS:", result);
} catch (error) {
  console.error("FAILED:", error);
}