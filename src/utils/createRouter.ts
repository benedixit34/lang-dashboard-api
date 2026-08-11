import { Router } from "express";
import type { RequestHandler } from "express";

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

  router.get("/", controller.list);

  router.get("/:id", controller.getOne);

  router.post("/", controller.create);

  router.patch("/:id", controller.update);

  router.delete("/:id", controller.remove);

  return router;
}

