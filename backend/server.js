/**
 * server.js — CostoBot Backend
 * Express entry point. Mount all routes here.
 * [GREENFIELD — defined by user]
 */
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./lib/logger');
const app = express();

// ---------------------------------------------------------------------------
// Security headers (Helmet)
// ---------------------------------------------------------------------------
app.use(helmet());
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// CORS — allow frontend origin only
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
}));

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
});

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// Health check — used by Render to verify the service is up
// ---------------------------------------------------------------------------
const { getConnectionState, getLastError } = require('./db/connection');

app.get('/health', (_req, res) => {
  const dbConnected = getConnectionState();
  const dbError = getLastError();

  res.json({
    status: 'ok',
    project: 'CostoBot',
    db: dbConnected ? 'connected' : 'disconnected',
    dbError: dbConnected ? undefined : dbError,
    ts: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const versionRoutes = require('./routes/version.routes');
const projectRoutes = require('./routes/project.routes');
const iaRoutes = require('./routes/ia.routes');
const { connectDB } = require('./db/connection');
app.use('/api/version', versionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ia', iaRoutes);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ---------------------------------------------------------------------------
// Global error handler — must have 4 params for Express to recognize it
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error('unhandled_error', {
    status,
    code,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code,
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
function logStartupDiagnostics() {
  const requiredVars = ['DATABASE_URL', 'FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY'];
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    logger.warn('startup_missing_env', { vars: missing, msg: 'Some required env vars are not set' });
  }
}

connectDB().then(() => {
  logStartupDiagnostics();
  app.listen(PORT, () => {
    logger.info('server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });
});

module.exports = app;
