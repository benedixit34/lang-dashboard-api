import { Router } from "express";
import type { RequestHandler } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

interface CrudController {
  list: RequestHandler;
  getOne: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
}

export function createCrudRouter(
  controller: CrudController,
) {
  const router = Router();

  // Public routes
  router.get("/", controller.list);
  router.get("/:id", controller.getOne);

  // Admin-only routes
  router.post(
    "/",
    authenticate,
    authorize("admin"),
    controller.create,
  );

  router.patch(
    "/:id",
    authenticate,
    authorize("admin"),
    controller.update,
  );

  router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    controller.remove,
  );

  return router;
}