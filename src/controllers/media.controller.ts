import type { Request, Response } from "express";

import { importMediaFromZip } from "../services/media.service.js";
import { uploadToBackblaze, listImagesFromBackblaze, deleteImageFromBackblaze } from "../services/backblaze.service.js";

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


export async function uploadMultipleImagesController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const files = req.files.map((file) => ({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
    }));

    const result =
      await uploadMultipleMedia(files);

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error(
      "Multiple image upload error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload images",
    });
  }
}


export async function listImagesController(
  req: Request,
  res: Response,
) {
  try {
    const images = await listImagesFromBackblaze();

    return res.status(200).json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error: any) {
    console.error(
      "Failed to list images:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to list images",
    });
  }
}




export async function deleteImageController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Image key is required",
      });
    }

    await deleteImageFromBackblaze(key);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "Delete image error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete image",
    });
  }
}
