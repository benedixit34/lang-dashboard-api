import { Router } from "express";

import {importVocabularyController} from "../controllers/vocabulary.controller.js";
import { uploadExcel } from "../middleware/upload.js";

const router = Router();

/**
 * @openapi
 * /api/v1/vocabulary/import:
 *   post:
 *     tags:
 *       - Vocabulary
 *     summary: Import vocabulary Excel
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
 *         description: Vocabulary import completed
 */
router.post(
  "/import",
  uploadExcel.single("file"),
  importVocabularyController,
);

export default router;

