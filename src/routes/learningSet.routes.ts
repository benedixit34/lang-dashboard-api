import { createCrudRouter } from "../utils/createrouter.utils.js";
import { learningSetController } from "../controllers/learningSet.controller.js";

export const learningSetRoutes =    createCrudRouter(learningSetController);