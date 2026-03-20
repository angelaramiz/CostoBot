/**
 * server.js — CostoBot Backend
 * Express entry point. Mount all routes here.
 * [GREENFIELD — defined by user]
 */
'use strict';

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
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

const versionWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Version record rate limit exceeded.' },
});

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// Health check — used by Render to verify the service is up
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: 'CostoBot', ts: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const versionRoutes = require('./routes/version.routes');
const { connectDB } = require('./db/connection');
app.use('/api/version', versionWriteLimiter, versionRoutes);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[CostoBot Backend] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});

module.exports = app;
