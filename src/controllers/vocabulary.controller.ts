import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { vocabulary } from "../db/schema.js";
import { uploadToBackblaze } from "../services/backblaze.service.js";
import {
  importVocabularyFromExcel,
  importVocabularyFromCsv,
} from "../services/vocabulary.service.js";
import path from "path";


import {
  createCrudController,
} from "../utils/createcontroller.utils.js";


const vocabularyCrudController = createCrudController({
  table: vocabulary,
  idColumn: vocabulary.id,

  fields: [
    {
      name: "itemId",
      column: vocabulary.itemId,
      required: true,
    },
    {
      name: "categoryId",
      column: vocabulary.categoryId,
    },
    {
      name: "learningSetId",
      column: vocabulary.learningSetId,
    },
    {
      name: "germanWord",
      column: vocabulary.germanWord,
      required: true,
    },
    {
      name: "englishMeaning",
      column: vocabulary.englishMeaning,
    },
    {
      name: "article",
      column: vocabulary.article,
    },
    {
      name: "wordType",
      column: vocabulary.wordType,
    },
    {
      name: "difficulty",
      column: vocabulary.difficulty,
    },
    {
      name: "imageIdea",
      column: vocabulary.imageIdea,
    },
    {
      name: "imageUrl",
      column: vocabulary.imageUrl,
    },
    {
      name: "audioUrl",
      column: vocabulary.audioUrl,
    },
  ],

  listFilters: [
    {
      name: "categoryId",
      column: vocabulary.categoryId,
    },
    {
      name: "learningSetId",
      column: vocabulary.learningSetId,
    },
    {
      name: "difficulty",
      column: vocabulary.difficulty,
    },
  ],

  notFoundMessage: "Vocabulary not found",
});





export async function importVocabularyController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload an Excel or CSV file",
      });
    }

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    let result;

    switch (extension) {
      case ".xlsx":
      case ".xls":
        result =
          await importVocabularyFromExcel(
            req.file.path,
          );
        break;

      case ".csv":
        result =
          await importVocabularyFromCsv(
            req.file.path,
          );
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Only Excel and CSV files are supported",
        });
    }

    return res.status(200).json({
      success: true,
      message:
        "Vocabulary import completed",
      data: result,
    });
  } catch (error: unknown) {
    console.error(
      "Vocabulary import error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to import vocabulary",
    });
  }
}





async function createVocabularyController(
  req: Request,
  res: Response,
) {
  try {
    const {
      itemId,
      categoryId,
      learningSetId,
      germanWord,
      englishMeaning,
      article,
      wordType,
      difficulty,
      imageIdea,
    } = req.body;

    const files = req.files as {
      image?: Express.Multer.File[];
      audio?: Express.Multer.File[];
    };

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;


    if (files?.image?.[0]) {
      const image = files.image[0];

      const key = `vocabulary/images/${Date.now()}-${image.originalname}`;

      imageUrl = await uploadToBackblaze(
        image.buffer,
        key,
        image.mimetype,
      );
    }

    if (files?.audio?.[0]) {
      const audio = files.audio[0];

      const key = `vocabulary/audio/${Date.now()}-${audio.originalname}`;

      audioUrl = await uploadToBackblaze(
        audio.buffer,
        key,
        audio.mimetype,
      );
    }

    
    const [newVocabulary] = await db
      .insert(vocabulary)
      .values({
        itemId,
        categoryId,
        learningSetId,
        germanWord,
        englishMeaning,
        article,
        wordType,
        difficulty,
        imageIdea,
        imageUrl,
        audioUrl,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Vocabulary created successfully",
      data: newVocabulary,
    });
  } catch (error: any) {
    console.error("Create vocabulary error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to create vocabulary",
    });
  }
}



export const vocabularyController = {
  ...vocabularyCrudController,
  create: createVocabularyController,
};