import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

import {
  importMediaController,
  listImagesController,
  uploadSingleImageController,
} from "../controllers/media.controller.js";

import {
  uploadMediaZip,
} from "../middleware/upload.js";

const router = Router();

/**
 * @openapi
 * /api/v1/media/import:
 *   post:
 *     tags:
 *       - Media
 *     summary: Import media ZIP
 *     description: Upload a ZIP file containing multiple media assets. The ZIP is processed and the media files are uploaded to storage.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: ZIP file containing media assets
 *     responses:
 *       200:
 *         description: Media import completed successfully
 *       400:
 *         description: ZIP file is missing or invalid
 *       500:
 *         description: Internal server error
 */
router.post(
  "/import",
  uploadMediaZip.single("file"),
  importMediaController,
);

/**
 * @openapi
 * /api/v1/media/upload:
 *   post:
 *     tags:
 *       - Media
 *     summary: Upload a single image
 *     description: Upload one image directly to media storage.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Image file is missing
 *       500:
 *         description: Internal server error
 */
router.post(
  "/upload",
  authenticate,
  authorize("admin"),
  uploadSingleImageController,
);





router.get(
  "/images",
  authenticate,
  authorize("admin"),
  listImagesController,
);

export const mediaRoutes = router;

export default mediaRoutes;