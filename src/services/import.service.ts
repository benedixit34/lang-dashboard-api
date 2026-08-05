import XLSX from "xlsx";
import fs from "fs";

import { db } from "../db/index.js";
import { vocabulary, categories, learningSets } from "../db/schema.js";

import { eq } from "drizzle-orm";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: {
    row: number;
    message: string;
  }[];
}

interface VocabularyExcelRow {
  "Item ID": string;
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
      throw new Error(`Worksheet "${sheetName}" does not exist`);
    }

    const rows = XLSX.utils.sheet_to_json<VocabularyExcelRow>(sheet);

    const records = [];

    for (let index = 0; index < rows.length; index++) {
      const row: any = rows[index];

      try {

        if (!row["Item ID"] || !row["German Word"]) {
          result.errors.push({
            row: index + 2,
            message: "Item ID and German Word are required",
          });

          result.skipped++;

          continue;
        }

        const category = await db.query.categories.findFirst({
          where: eq(categories.name, row.Category),
        });

        if (!category) {
          result.errors.push({
            row: index + 2,
            message: `Category "${row.Category}" not found`,
          });

          result.skipped++;

          continue;
        }


        const learningSet = await db.query.learningSets.findFirst({
          where: eq(learningSets.name, row["Learning Set"]),
        });

        if (!learningSet) {
          result.errors.push({
            row: index + 2,
            message: `Learning Set "${row["Learning Set"]}" not found`,
          });

          result.skipped++;

          continue;
        }

        records.push({
          itemId: row["Item ID"],

          categoryId: category.id,

          learningSetId: learningSet.id,

          germanWord: row["German Word"],

          englishMeaning: row["English Meaning"],

          article: row.Article,

          wordType: row["Word Type"],

          difficulty: row.Difficulty,

          imageIdea: row["Image Idea"],

          imageUrl: row.Image ?? null,

          audioUrl: row.Audio ?? null,
        });
      } catch (error: any) {
        result.errors.push({
          row: index + 2,
          message: error.message,
        });

        result.skipped++;
      }
    }


    if (records.length) {
      await db.insert(vocabulary).values(records);
    }

    result.imported = records.length;

    return result;
  } finally {
 

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
