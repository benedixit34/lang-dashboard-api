import { learningSets } from "../db/schema.js";
import { createCrudController } from "../utils/createcontroller.utils.js";

export const learningSetController =
  createCrudController({
    table: learningSets,
    idColumn: learningSets.id,

    fields: [
      {
        name: "name",
        column: learningSets.name,
        required: true,
      },
    ],

    notFoundMessage:
      "Learning Set not found",
  });

