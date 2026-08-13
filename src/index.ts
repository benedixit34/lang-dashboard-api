import express from 'express';
import type { Request, Response, Express } from 'express';
import "dotenv/config";
import { categoryRoutes } from './routes/category.routes.js';
import { cityRoutes } from './routes/city.routes.js';
import { learningSetRoutes } from './routes/learningSet.routes.js'
import mediaRoutes from "./routes/media.routes.js";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger.js";
import { vocabularyRoutes } from './routes/vocabulary.routes.js';
import authRouter from './routes/auth.routes.js';
import passport from "./config/passport.js";



const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express paired with TypeScript!');
});


app.use(`/${process.env.API_PREFIX}/categories`, categoryRoutes);
app.use(`/${process.env.API_PREFIX}/cities`, cityRoutes);
app.use(`/${process.env.API_PREFIX}/learningsets`, learningSetRoutes);
app.use(`/${process.env.API_PREFIX}/media`, mediaRoutes);
app.use(`/${process.env.API_PREFIX}/vocabulary`, vocabularyRoutes);
app.use(`/${process.env.API_PREFIX}/auth`, authRouter);

app.use(passport.initialize());

app.use(`/${process.env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(port, () => {
  console.log(`[server]: Server running at http://localhost:${port}`);
});