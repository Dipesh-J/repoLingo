import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import router from './routes.js';
import { setupListeners } from './handlers.js';
import { connectDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

setupListeners();

// CORS with credentials support for auth cookies
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
    res.send('Lingo Translator Server Running');
});

// Start server with MongoDB connection
async function start() {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Frontend URL: ${FRONTEND_URL}`);
    });
}

start().catch(console.error);
