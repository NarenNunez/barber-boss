// server.js — Barber Boss API
import 'dotenv/config';
import express         from 'express';
import cors            from 'cors';
import helmet          from 'helmet';
import compression     from 'compression';
import morgan          from 'morgan';
import rateLimit       from 'express-rate-limit';

import { logger }      from './lib/logger.js';
import { loginAdmin, loginBarberoPin } from './middleware/auth.js';

// Routers
import reservasRouter  from './api/reservas.js';
import barberosRouter  from './api/barberos.js';
import statsRouter     from './api/stats.js';
import serviciosRouter from './api/servicios.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Seguridad base ────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: msg => logger.http(msg.trim()) }
  }));
}

// ── Rate Limiting ─────────────────────────────────────────────
// Global: 200 req/15min por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});
app.use(globalLimiter);

// Estricto para login: 10 intentos/15min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});

// Reservas públicas: 30/min (protege contra bots)
const reservaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Límite de reservas alcanzado. Espera un momento.' },
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' });
});

// ── Auth endpoints ────────────────────────────────────────────
app.post('/api/auth/login',       loginLimiter, loginAdmin);
app.post('/api/auth/barbero/pin', loginLimiter, loginBarberoPin);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/reservas',  reservaLimiter, reservasRouter);
app.use('/api/barberos',  barberosRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/stats',     statsRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);

  // Multer: archivo demasiado grande
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'Archivo demasiado grande (máx 5MB)' });

  // Multer: tipo de archivo
  if (err.message?.includes('Tipo de archivo no permitido'))
    return res.status(415).json({ error: err.message });

  // Otros errores
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

// ── Iniciar ───────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Barber Boss API corriendo en puerto ${PORT}`);
  logger.info(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
