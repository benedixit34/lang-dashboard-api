import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

import {
  importMediaController,
  listImagesController,
  uploadSingleImageController,
  uploadMultipleImagesController,
  deleteImageController,
} from "../controllers/media.controller.js";

import {
  uploadMediaZip, uploadImages
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
  authenticate,
  authorize('admin'),
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
  uploadImages.single("file"),
  uploadSingleImageController,
);


/**
 * @openapi
 * /api/v1/media/images:
 *   get:
 *     tags:
 *       - Media
 *     summary: List all images
 *     description: Retrieve all images stored in media storage.
 *     responses:
 *       200:
 *         description: Images retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         example: vocabulary/images/hallo.webp
 *                       url:
 *                         type: string
 *                         example: https://s3.us-east-005.backblazeb2.com/leximatch/vocabulary/images/hallo.webp
 *       500:
 *         description: Internal server error.
 */

router.get(
  "/images",
  authenticate,
  authorize("admin"),
  listImagesController,
);



/**
 * @openapi
 * /api/v1/media/images:
 *   delete:
 *     tags:
 *       - Media
 *     summary: Delete an image
 *     description: Delete an image from media storage using its object key.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: Object key of the image to delete.
 *                 example: vocabulary/images/hallo.webp
 *     responses:
 *       200:
 *         description: Image deleted successfully.
 *       400:
 *         description: Image key is missing.
 *       500:
 *         description: Internal server error.
 */
router.delete(
  "/images",
  authenticate,
  authorize("admin"),
  deleteImageController,
);


router.post(
  "/upload/multiple",
  authenticate,
  authorize("admin"),
  uploadImages.array("files", 20),
  uploadMultipleImagesController,
);

export const mediaRoutes = router;

export default mediaRoutes;