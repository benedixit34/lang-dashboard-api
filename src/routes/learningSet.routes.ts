import { createCrudRouter } from "../utils/createRouter.js";
import { learningSetController } from "../controllers/learningSet.controller.js";

export const learningSetRoutes = createCrudRouter(learningSetController);