// server.js
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

// ---- CORS (NO path argument given to app.use) ----
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://villagulposh.netlify.app',
];
const EXTRA = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const WHITELIST = [...new Set([...DEFAULT_ORIGINS, ...EXTRA])];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);            // allow Postman/cURL/SSR
    if (WHITELIST.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ---- Body & cookies ----
app.use(express.json());
app.use(cookieParser());

// ---- Health check ----
app.get('/', (_req, res) => res.send('API OK'));

// ---- API routes (paths only, no absolute URLs) ----
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

// ---- Start ----
const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => app.listen(port, () => console.log(`Connected! Running on ${port}`)))
  .catch(err => {
    console.error('Mongo connect error:', err);
    process.exit(1);
  });
