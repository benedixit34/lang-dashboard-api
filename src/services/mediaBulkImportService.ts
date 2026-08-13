import unzipper from "unzipper";
import path from "path";

import { uploadToBackblaze } from "./backblaze.service.js";

interface MediaImportResult {
  uploaded: number;
  skipped: number;
  errors: {
    filename: string;
    message: string;
  }[];
  files: {
    filename: string;
    key: string;
    url: string;
  }[];
}

const ALLOWED_EXTENSIONS = {
  images: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  audio: [".mp3", ".wav", ".m4a", ".ogg"],
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",

  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
};

export async function importMediaFromZip(
  buffer: Buffer,
): Promise<MediaImportResult> {
  const result: MediaImportResult = {
    uploaded: 0,
    skipped: 0,
    errors: [],
    files: [],
  };

  const directory = await unzipper.Open.buffer(buffer);

  for (const file of directory.files) {
    try {
      // Ignore folders
      if (file.type === "Directory") {
        continue;
      }

      const extension = path
        .extname(file.path)
        .toLowerCase();

      const isImage =
        ALLOWED_EXTENSIONS.images.includes(extension);

      const isAudio =
        ALLOWED_EXTENSIONS.audio.includes(extension);

      
      if (!isImage && !isAudio) {
        result.skipped++;

        continue;
      }

    
      const filename = path.basename(file.path);

      const folder = isImage
        ? "images"
        : "audio";

      const key = `vocabulary/${folder}/${filename}`;

      const fileBuffer = await file.buffer();

      const contentType =
        CONTENT_TYPES[extension] ||
        "application/octet-stream";

      const url = await uploadToBackblaze(
        fileBuffer,
        key,
        contentType,
      );

      result.uploaded++;

      result.files.push({
        filename: file.path,
        key,
        url,
      });
    } catch (error: any) {
      result.errors.push({
        filename: file.path,
        message:
          error.message || "Failed to upload file",
      });
    }
  }

  return result;
}