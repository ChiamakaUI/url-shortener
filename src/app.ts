import 'dotenv/config'
import express, { type Express } from "express";

import router from './routes/index.js'
import { logger, errorHandler } from './middleware/index.js';

const app: Express = express();
const PORT = process.env.PORT
app.use(express.json());

app.use(logger)
app.use('/', router)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`URL shortener server running on port ${PORT}`);
});

export default app;

// 8:05