import XLSX from "xlsx";
import fs from "fs";
import crypto from "crypto";

import { db } from "../db/index.js";
import {
  vocabulary,
  categories,
  learningSets,
} from "../db/schema.js";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: {
    row: number;
    message: string;
  }[];
}

interface VocabularyExcelRow {
  "Item ID"?: string; // Optional
  Category: string;
  "Learning Set": string;
  "German Word": string;
  "English Meaning": string;
  Article: string;
  "Word Type": string;
  Difficulty: string;
  "Image Idea": string;
  Image?: string;
  Audio?: string;
}

export async function importVocabularyFromExcel(
  filePath: string,
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const workbook = XLSX.readFile(filePath);

    const sheetName = workbook.SheetNames.at(0);

    if (!sheetName) {
      throw new Error("Excel file contains no sheets");
    }

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(
        `Worksheet "${sheetName}" does not exist`,
      );
    }

    const rows =
      XLSX.utils.sheet_to_json<VocabularyExcelRow>(
        sheet,
      );

    // =========================
    // LOAD EXISTING DATA
    // =========================

    const existingCategories = await db
      .select()
      .from(categories);

    const existingLearningSets = await db
      .select()
      .from(learningSets);

    // =========================
    // CATEGORY MAP
    // =========================

    const categoryMap = new Map<string, string>();

    for (const category of existingCategories) {
      categoryMap.set(
        category.name.trim().toLowerCase(),
        category.id,
      );
    }

    // =========================
    // LEARNING SET MAP
    // =========================

    const learningSetMap = new Map<string, string>();

    for (const learningSet of existingLearningSets) {
      learningSetMap.set(
        learningSet.name.trim().toLowerCase(),
        learningSet.id,
      );
    }

    // =========================
    // VOCABULARY RECORDS
    // =========================

    const records: Array<{
      itemId: string;
      categoryId: string;
      learningSetId: string;
      germanWord: string;
      englishMeaning: string | null;
      article: string | null;
      wordType: string | null;
      difficulty: string | null;
      imageIdea: string | null;
      imageUrl: string | null;
      audioUrl: string | null;
    }> = [];

    // =========================
    // PROCESS ROWS
    // =========================

    for (const [index, row] of rows.entries()) {
      try {
        // =========================
        // ITEM ID
        // =========================

        const itemId =
          String(row["Item ID"] ?? "").trim() ||
          crypto.randomUUID();

        // =========================
        // GERMAN WORD
        // =========================

        const germanWord = String(
          row["German Word"] ?? "",
        ).trim();

        if (!germanWord) {
          result.errors.push({
            row: index + 2,
            message: "German Word is required",
          });

          result.skipped++;
          continue;
        }

        // =========================
        // CATEGORY
        // =========================

        const categoryName = String(
          row.Category ?? "",
        ).trim();

        if (!categoryName) {
          result.errors.push({
            row: index + 2,
            message: "Category is required",
          });

          result.skipped++;
          continue;
        }

        const categoryKey =
          categoryName.toLowerCase();

        let categoryId =
          categoryMap.get(categoryKey);

        // Create category if it doesn't exist
        if (!categoryId) {
          const [newCategory] = await db
            .insert(categories)
            .values({
              name: categoryName,
            })
            .returning({
              id: categories.id,
            });

          if (!newCategory) {
            throw new Error(
              `Failed to create category "${categoryName}"`,
            );
          }

          categoryId = newCategory.id;

          categoryMap.set(
            categoryKey,
            categoryId,
          );
        }

        // =========================
        // LEARNING SET
        // =========================

        const learningSetName = String(
          row["Learning Set"] ?? "",
        ).trim();

        if (!learningSetName) {
          result.errors.push({
            row: index + 2,
            message: "Learning Set is required",
          });

          result.skipped++;
          continue;
        }

        const learningSetKey =
          learningSetName.toLowerCase();

        let learningSetId =
          learningSetMap.get(
            learningSetKey,
          );

        // Create learning set if it doesn't exist
        if (!learningSetId) {
          const [newLearningSet] =
            await db
              .insert(learningSets)
              .values({
                name: learningSetName,
              })
              .returning({
                id: learningSets.id,
              });

          if (!newLearningSet) {
            throw new Error(
              `Failed to create learning set "${learningSetName}"`,
            );
          }

          learningSetId =
            newLearningSet.id;

          learningSetMap.set(
            learningSetKey,
            learningSetId,
          );
        }

        // =========================
        // VOCABULARY
        // =========================

        records.push({
          itemId,

          categoryId,

          learningSetId,

          germanWord,

          englishMeaning:
            row["English Meaning"]?.trim() ||
            null,

          article:
            row.Article?.trim() || null,

          wordType:
            row["Word Type"]?.trim() || null,

          difficulty:
            row.Difficulty?.trim() || null,

          imageIdea:
            row["Image Idea"]?.trim() || null,

          imageUrl:
            row.Image?.trim() || null,

          audioUrl:
            row.Audio?.trim() || null,
        });
      } catch (error: unknown) {
        result.errors.push({
          row: index + 2,
          message:
            error instanceof Error
              ? error.message
              : "Failed to process row",
        });

        result.skipped++;
      }
    }

    // =========================
    // INSERT VOCABULARY
    // =========================

    if (records.length > 0) {
      await db
        .insert(vocabulary)
        .values(records);
    }

    result.imported = records.length;

    return result;
  } finally {
    // =========================
    // DELETE TEMPORARY FILE
    // =========================

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}