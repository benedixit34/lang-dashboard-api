import XLSX from "xlsx";
import fs from "fs";
import crypto from "crypto";
import { parse } from "csv-parse/sync";

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

interface VocabularyRow {
  "Item ID"?: string;
  Category?: string;
  "Learning Set"?: string;
  "German Word"?: string;
  "English Meaning"?: string;
  Article?: string;
  "Word Type"?: string;
  Difficulty?: string;
  "Image Idea"?: string;
  Image?: string;
  Audio?: string;
}

interface VocabularyRecord {
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
}

interface LookupMaps {
  categoryMap: Map<string, string>;
  learningSetMap: Map<string, string>;
}

//Normalize a value from an imported row.
function clean(value: unknown): string {
  return String(value ?? "").trim();
}

//Load existing categories and learning sets.
async function createLookupMaps(): Promise<LookupMaps> {
  const [
    existingCategories,
    existingLearningSets,
  ] = await Promise.all([
    db.select().from(categories),
    db.select().from(learningSets),
  ]);

  const categoryMap = new Map<string, string>();

  for (const category of existingCategories) {
    categoryMap.set(
      category.name.trim().toLowerCase(),
      category.id,
    );
  }

  const learningSetMap = new Map<string, string>();

  for (const learningSet of existingLearningSets) {
    learningSetMap.set(
      learningSet.name.trim().toLowerCase(),
      learningSet.id,
    );
  }

  return {
    categoryMap,
    learningSetMap,
  };
}

// Find an existing category or create a new one.
async function getOrCreateCategory(
  name: string,
  categoryMap: Map<string, string>,
): Promise<string> {
  const key = name.toLowerCase();

  const existingId = categoryMap.get(key);

  if (existingId) {
    return existingId;
  }

  const [category] = await db
    .insert(categories)
    .values({
      name,
    })
    .returning({
      id: categories.id,
    });

  if (!category) {
    throw new Error(
      `Failed to create category "${name}"`,
    );
  }

  categoryMap.set(key, category.id);

  return category.id;
}

//Find an existing learning set or create a new one.
async function getOrCreateLearningSet(
  name: string,
  learningSetMap: Map<string, string>,
): Promise<string> {
  const key = name.toLowerCase();

  const existingId =
    learningSetMap.get(key);

  if (existingId) {
    return existingId;
  }

  const [learningSet] = await db
    .insert(learningSets)
    .values({
      name,
    })
    .returning({
      id: learningSets.id,
    });

  if (!learningSet) {
    throw new Error(
      `Failed to create learning set "${name}"`,
    );
  }

  learningSetMap.set(
    key,
    learningSet.id,
  );

  return learningSet.id;
}

//Validate and transform one imported row.
async function buildVocabularyRecord(
  row: VocabularyRow,
  maps: LookupMaps,
): Promise<VocabularyRecord> {
  const germanWord = clean(
    row["German Word"],
  );

  if (!germanWord) {
    throw new Error(
      "German Word is required",
    );
  }

  const categoryName = clean(
    row.Category,
  );

  if (!categoryName) {
    throw new Error(
      "Category is required",
    );
  }

  const learningSetName = clean(
    row["Learning Set"],
  );

  if (!learningSetName) {
    throw new Error(
      "Learning Set is required",
    );
  }

  const [
    categoryId,
    learningSetId,
  ] = await Promise.all([
    getOrCreateCategory(
      categoryName,
      maps.categoryMap,
    ),
    getOrCreateLearningSet(
      learningSetName,
      maps.learningSetMap,
    ),
  ]);

  return {
    itemId:
      clean(row["Item ID"]) ||
      crypto.randomUUID(),

    categoryId,
    learningSetId,

    germanWord,

    englishMeaning:
      clean(row["English Meaning"]) ||
      null,

    article:
      clean(row.Article) ||
      null,

    wordType:
      clean(row["Word Type"]) ||
      null,

    difficulty:
      clean(row.Difficulty) ||
      null,

    imageIdea:
      clean(row["Image Idea"]) ||
      null,

    imageUrl:
      clean(row.Image) ||
      null,

    audioUrl:
      clean(row.Audio) ||
      null,
  };
}

//Import vocabulary rows into the database.
async function importVocabularyRows(
  rows: VocabularyRow[],
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const maps = await createLookupMaps();

  const records: VocabularyRecord[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    try {
      const record =
        await buildVocabularyRecord(
          row,
          maps,
        );

      records.push(record);
    } catch (error: unknown) {
      result.errors.push({
        row: rowNumber,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process row",
      });

      result.skipped++;
    }
  }

  if (records.length > 0) {
    await db
      .insert(vocabulary)
      .values(records);
  }

  result.imported = records.length;

  return result;
}

//Import vocabulary from an Excel file.
export async function importVocabularyFromExcel(
  filePath: string,
): Promise<ImportResult> {
  try {
    const workbook =
      XLSX.readFile(filePath);

    const sheetName =
      workbook.SheetNames.at(0);

    if (!sheetName) {
      throw new Error(
        "Excel file contains no sheets",
      );
    }

    const sheet =
      workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(
        `Worksheet "${sheetName}" does not exist`,
      );
    }

    const rows =
      XLSX.utils.sheet_to_json<VocabularyRow>(
        sheet,
        {
          defval: "",
        },
      );

    return await importVocabularyRows(rows);
  } finally {
    removeTemporaryFile(filePath);
  }
}

//Import vocabulary from a CSV file.
export async function importVocabularyFromCsv(
  filePath: string,
): Promise<ImportResult> {
  try {
    const csv = fs.readFileSync(
      filePath,
      "utf-8",
    );

    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as VocabularyRow[];

    return await importVocabularyRows(rows);
  } finally {
    removeTemporaryFile(filePath);
  }
}

// Remove an uploaded temporary file.
function removeTemporaryFile(
  filePath: string,
): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}