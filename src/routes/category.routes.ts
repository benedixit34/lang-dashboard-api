import { createCrudRouter } from "../utils/createrouter.utils.js";
import { categoriesController } from "../controllers/category.controller.js";

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List categories
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *
 * /api/v1/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No Content
 */

export const categoryRoutes = createCrudRouter(categoriesController);