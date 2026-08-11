import { Router } from "express";

import {
  importMediaController,
} from "../controllers/media.controller.js";

import {
  uploadMediaZip,
} from "../middleware/upload.js";

const router = Router();

router.post(
  "/import",
  uploadMediaZip.single("file"),
  importMediaController,
);

export default router;