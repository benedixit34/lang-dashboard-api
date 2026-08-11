import { createCrudRouter } from "../utils/createRouter.js";
import { citiesController } from "../controllers/city.controller.js";

export const cityRoutes = createCrudRouter(citiesController);