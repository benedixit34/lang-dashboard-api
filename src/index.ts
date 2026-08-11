import express from 'express';
import type { Request, Response, Express } from 'express';
import dotenv from 'dotenv';
import { categoryRoutes } from './routes/category.routes.js';
import { cityRoutes } from './routes/city.routes.js';
import { learningSetRoutes } from './routes/learningSet.routes.js'


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express paired with TypeScript!');
});


app.use('/categories', categoryRoutes);
app.use('/cities', cityRoutes);
app.use('/learningsets', learningSetRoutes);

app.listen(port, () => {
  console.log(`[server]: Server running at http://localhost:${port}`);
});