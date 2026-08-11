import { createCrudRouter } from "../utils/createRouter.js";
import { learningSetController } from "../controllers/learningSet.controller.js";

/**
 * @openapi
 * /api/v1/learningsets:
 *   get:
 *     tags:
 *       - LearningSets
 *     summary: List learning sets
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags:
 *       - LearningSets
 *     summary: Create a learning set
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
 * /api/v1/learningsets/{id}:
 *   get:
 *     tags:
 *       - LearningSets
 *     summary: Get learning set by id
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
 *       - LearningSets
 *     summary: Update a learning set
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
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags:
 *       - LearningSets
 *     summary: Delete a learning set
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

export const learningSetRoutes = createCrudRouter(learningSetController);