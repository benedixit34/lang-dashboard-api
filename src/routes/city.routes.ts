import { createCrudRouter } from "../utils/createRouter.js";
import { citiesController } from "../controllers/city.controller.js";

/**
 * @openapi
 * /api/v1/cities:
 *   get:
 *     tags:
 *       - Cities
 *     summary: List cities
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags:
 *       - Cities
 *     summary: Create a city
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *
 * /api/v1/cities/{id}:
 *   get:
 *     tags:
 *       - Cities
 *     summary: Get city by id
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
 *       - Cities
 *     summary: Update a city
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
 *       - Cities
 *     summary: Delete a city
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

export const cityRoutes = createCrudRouter(citiesController);