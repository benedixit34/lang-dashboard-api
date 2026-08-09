import type { Request, Response } from "express";

import { importMediaFromZip } from "../services/mediaBulkImportService.js";
import { uploadToBackblaze } from "../utils/backblaze.js";

export async function importMediaController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a ZIP file",
      });
    }

    const result = await importMediaFromZip(
      req.file.buffer,
    );

    return res.status(200).json({
      success: true,
      message: "Media import completed",
      data: result,
    });
  } catch (error: any) {
    console.error("Media import error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to import media",
    });
  }
}



export async function uploadSingleImageController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const key = `vocabulary/images/${Date.now()}-${req.file.originalname}`;

    const url = await uploadToBackblaze(
      req.file.buffer,
      key,
      req.file.mimetype,
    );

    return res.status(200).json({
      success: true,
      data: {
        filename: req.file.originalname,
        key,
        url,
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
}