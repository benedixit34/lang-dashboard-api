import { createCrudRouter } from "../utils/createRouter.js";
import { categoriesController } from "../controllers/category.controller.js";

export default createCrudRouter(categoriesController);