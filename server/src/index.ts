import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { router as apiRouter } from './routes';
import path from 'path';
import { authRouter } from './routes/auth';
import { requireAuth } from './routes/authMiddleware';
import { errorHandler } from './utils/errorHandler';

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Public auth endpoints
app.use('/auth', authRouter);
// Optional alias so clients using an /api base can also call /api/auth/*
app.use('/api/auth', authRouter);

// Protect API routes
app.use('/api', requireAuth, apiRouter);

// error handler at the end
app.use(errorHandler);

// Static hosting for client (production)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist', 'client', 'browser');
app.use(express.static(clientDist));
// SPA fallback: send index.html for unknown routes (except API/auth already handled above)
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const MONGODB_URI = process.env.MONGODB_URI as string | undefined;
const DB_NAME = process.env.DB_NAME as string | undefined;
const IS_PROD = process.env.NODE_ENV === 'production';

async function start() {
  let uri = MONGODB_URI;
  if (!uri) {
    if (IS_PROD) {
      console.error('MONGODB_URI is not set. Refusing to start in production without a database.');
      process.exit(1);
    }
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('Using in-memory MongoDB for development');
  }
  if (DB_NAME) {
    await mongoose.connect(uri!, { dbName: DB_NAME });
    console.log(`Connected to MongoDB (db: ${DB_NAME})`);
  } else {
    await mongoose.connect(uri!);
    console.log('Connected to MongoDB (default db)');
  }
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Startup error', err);
  process.exit(1);
});
