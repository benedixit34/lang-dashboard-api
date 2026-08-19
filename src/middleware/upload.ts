import multer from "multer";
import path from "path";
import fs from "fs";

const memoryStorage = multer.memoryStorage();

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const spreadsheetStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

    cb(
      null,
      `vocabulary-${Date.now()}${extension}`,
    );
  },
});

const spreadsheetFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb,
) => {
  const allowedExtensions = [
    ".xlsx",
    ".xls",
    ".csv",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error(
        "Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed",
      ),
    );
  }

  cb(null, true);
};

export const uploadSpreadsheet = multer({
  storage: spreadsheetStorage,

  fileFilter: spreadsheetFileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =========================
// MEDIA ZIP
// =========================

export const uploadMediaZip = multer({
  storage: memoryStorage,

  fileFilter: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (extension !== ".zip") {
      return cb(
        new Error("Only ZIP files are allowed"),
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const imageUpload = multer({
  storage: memoryStorage,

  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only JPG, JPEG, PNG, WebP, and GIF images are allowed",
        ),
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadImage = imageUpload;

export const uploadImages = imageUpload;