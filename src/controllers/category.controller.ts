import { categories } from "../db/schema.js";
import { createCrudController } from "../utils/createCrudController.js";

const categoryCrud = createCrudController({
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

export const listCategoriesController =
  categoryCrud.list;

export const getCategoryController =
  categoryCrud.getOne;

export const createCategoryController =
  categoryCrud.create;

export const updateCategoryController =
  categoryCrud.update;

export const deleteCategoryController =
  categoryCrud.remove;

