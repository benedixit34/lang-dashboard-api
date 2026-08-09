import { Router } from "express";

import {importVocabularyController} from "../controllers/vocabulary.controller.js";
import { uploadExcel } from "../middleware/upload.js";

const router = Router();

router.post(
  "/import",
  uploadExcel.single("file"),
  importVocabularyController,
);

export default router;

