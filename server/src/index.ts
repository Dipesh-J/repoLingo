import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import router from './routes.js';

import { setupListeners } from './handlers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

setupListeners();

app.use(cors());
app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
  res.send('Lingo Translator Server Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
