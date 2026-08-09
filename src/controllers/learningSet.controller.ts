import { learningSets } from "../db/schema.js";
import { createCrudController } from "../utils/createCrudController.js";

const learningSetCrud =
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

export const listLearningSetsController =
  learningSetCrud.list;

export const getLearningSetController =
  learningSetCrud.getOne;

export const createLearningSetController =
  learningSetCrud.create;

export const updateLearningSetController =
  learningSetCrud.update;

export const deleteLearningSetController =
  learningSetCrud.remove;