import { cities } from "../db/schema.js";
import { createCrudController } from "../utils/createCrudController.js";

export const citiesController = createCrudController({
  table: cities,
  idColumn: cities.id,

  fields: [
    {
      name: "name",
      column: cities.name,
      required: true,
    },
    {
      name: "country",
      column: cities.country,
      required: true,
    },
    {
      name: "imageUrl",
      column: cities.imageUrl,
    },
    {
      name: "levelId",
      column: cities.levelId,
    },
  ],

  listFilters: [
    {
      name: "levelId",
      column: cities.levelId,
    },
  ],

  notFoundMessage: "City not found",
});

