import unzipper from "unzipper";
import path from "path";

import { uploadToBackblaze } from "./backblaze.service.js";

interface MediaFile {
  buffer: Buffer;
  filename: string;
  mimetype?: string;
}

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

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
];

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
];

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


function getMediaType(
  filename: string,
): "images" | "audio" | null {
  const extension = path
    .extname(filename)
    .toLowerCase();

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return "images";
  }

  if (AUDIO_EXTENSIONS.includes(extension)) {
    return "audio";
  }

  return null;
}


function getContentType(filename: string): string {
  const extension = path
    .extname(filename)
    .toLowerCase();

  return (
    CONTENT_TYPES[extension] ||
    "application/octet-stream"
  );
}


export async function uploadMediaFile(
  file: MediaFile,
) {
  const mediaType = getMediaType(file.filename);

  if (!mediaType) {
    throw new Error(
      `Unsupported media type: ${file.filename}`,
    );
  }

  const filename = path.basename(file.filename);

  const key = `vocabulary/${mediaType}/${filename}`;

  const contentType =
    file.mimetype ||
    getContentType(file.filename);

  const url = await uploadToBackblaze(
    file.buffer,
    key,
    contentType,
  );

  return {
    filename: file.filename,
    key,
    url,
  };
}


export async function uploadMultipleMedia(
  files: MediaFile[],
): Promise<MediaImportResult> {
  const result: MediaImportResult = {
    uploaded: 0,
    skipped: 0,
    errors: [],
    files: [],
  };

  for (const file of files) {
    try {
      const mediaType = getMediaType(
        file.filename,
      );

      if (!mediaType) {
        result.skipped++;
        continue;
      }

      const uploadedFile =
        await uploadMediaFile(file);

      result.uploaded++;

      result.files.push(uploadedFile);
    } catch (error: unknown) {
      result.errors.push({
        filename: file.filename,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload file",
      });
    }
  }

  return result;
}

/**
 * Import media from a ZIP archive.
 */
export async function importMediaFromZip(
  buffer: Buffer,
): Promise<MediaImportResult> {
  const directory =
    await unzipper.Open.buffer(buffer);

  const files: MediaFile[] = [];

  for (const file of directory.files) {
    if (file.type === "Directory") {
      continue;
    }

    const mediaType = getMediaType(file.path);

    if (!mediaType) {
      continue;
    }

    files.push({
      buffer: await file.buffer(),
      filename: file.path,
    });
  }

  return uploadMultipleMedia(files);
}