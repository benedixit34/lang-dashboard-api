import { Router } from "express";

import {
  importMediaController,
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media import completed
 */
router.post(
  "/import",
  uploadMediaZip.single("file"),
  importMediaController,
);

export default router;