import { categories } from "../db/schema.js";
import { createCrudController } from "../utils/createCrudController.js";

export const categoriesController = createCrudController({
  table: categories,
  idColumn: categories.id,

  fields: [
    {
      name: "name",
      column: categories.name,
      required: true,
    },
  ],

  notFoundMessage: "Category not found",
});
