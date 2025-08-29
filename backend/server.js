// server.js (safe version)
import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
app.set('trust proxy', 1);

const WHITELIST = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://villagulposh.netlify.app',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin || WHITELIST.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));            // ✅ no path argument here
app.options('*', cors(corsOptions));   // ✅ preflight

app.use(express.json());
app.use(cookieParser());

// (optional) health
app.get('/', (_req, res) => res.send('API OK'));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(port, () => console.log(`Connected! Running on ${port}`));
}).catch(console.error);
