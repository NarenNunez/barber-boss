// api/index.js — Vercel serverless entry point
import 'dotenv/config';
import express         from 'express';
import cors            from 'cors';
import helmet          from 'helmet';
import compression     from 'compression';
import rateLimit       from 'express-rate-limit';

import { logger }      from '../lib/logger.js';
import { loginAdmin, loginBarberoPin } from '../middleware/auth.js';

import reservasRouter  from './reservas.js';
import barberosRouter  from './barberos.js';
import statsRouter     from './stats.js';
import serviciosRouter from './servicios.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});
app.use(globalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});

const reservaLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  message: { error: 'Límite de reservas alcanzado. Espera un momento.' },
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' });
});

app.post('/api/auth/login',       loginLimiter, loginAdmin);
app.post('/api/auth/barbero/pin', loginLimiter, loginBarberoPin);

app.use('/api/reservas',  reservaLimiter, reservasRouter);
app.use('/api/barberos',  barberosRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/stats',     statsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'Archivo demasiado grande (máx 5MB)' });
  if (err.message?.includes('Tipo de archivo no permitido'))
    return res.status(415).json({ error: err.message });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

export default app;