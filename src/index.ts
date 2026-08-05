import express from 'express';
import type { Request, Response, Express } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Built-in body parser middleware
app.use(express.json());

// Type-safe route parameters
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express paired with TypeScript!');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server running at http://localhost:${port}`);
});
