import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

import {
  importVocabularyController,
  vocabularyController,
} from "../controllers/vocabulary.controller.js";

import { uploadExcel } from "../middleware/upload.js";
import { createCrudRouter } from "../utils/createRouter.js";

const router = Router();

// CRUD routes
router.use("/", createCrudRouter(vocabularyController));

// Import route
/**
 * @openapi
 * /api/v1/vocabulary:
 *   get:
 *     tags:
 *       - Vocabulary
 *     summary: List vocabulary
 *     description: Retrieve a paginated list of vocabulary records.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Vocabulary list retrieved successfully
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags:
 *       - Vocabulary
 *     summary: Create a vocabulary
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vocabulary created successfully
 *       400:
 *         description: Missing required field
 *
 * /api/v1/vocabulary/{id}:
 *   get:
 *     tags:
 *       - Vocabulary
 *     summary: Get vocabulary by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vocabulary retrieved successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Vocabulary not found
 *
 *   patch:
 *     tags:
 *       - Vocabulary
 *     summary: Update vocabulary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vocabulary updated successfully
 *       400:
 *         description: Invalid ID or no fields provided
 *       404:
 *         description: Vocabulary not found
 *
 *   delete:
 *     tags:
 *       - Vocabulary
 *     summary: Delete vocabulary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Vocabulary deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Vocabulary not found
 *
 * /api/v1/vocabulary/import:
 *   post:
 *     tags:
 *       - Vocabulary
 *     summary: Import vocabulary from Excel
 *     description: Upload an Excel file containing vocabulary records.
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
 *                 description: Excel file containing vocabulary data
 *     responses:
 *       200:
 *         description: Vocabulary import completed successfully
 *       400:
 *         description: Invalid Excel file or validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/import",
  authenticate,
  authorize("admin"),
  uploadExcel.single("file"),
  importVocabularyController,
);

export const vocabularyRoutes = router;

export default vocabularyRoutes;