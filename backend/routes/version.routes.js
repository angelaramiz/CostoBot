/**
 * version.routes.js — CostoBot
 * Provides version information and accepts version record writes.
 *
 * Routes:
 *   GET  /api/version         → returns current version (PUBLIC key required)
 *   POST /api/version/record  → records a version bump event (INTERNAL key required)
 *   GET  /api/version/history → returns version history (INTERNAL key required)
 *
 * Mount in your Express app with:
 *   const versionRoutes = require('./routes/version.routes');
 *   app.use('/api/version', versionRoutes);
 *
 * Rate limiting: apply express-rate-limit at the app level.
 * [GREENFIELD — defined by user]
 */
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requirePublicKey, requireInternalKey } = require('../middleware/apiKey.middleware');
const { getConnectionState } = require('../db/connection');
const VersionHistory = require('../db/VersionHistory.model');
const logger = require('../lib/logger');

// Rate limiter only for write operations
const versionWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Version record rate limit exceeded.' },
});

// ---------------------------------------------------------------------------
// In-memory fallback (used when MongoDB is not connected)
// ---------------------------------------------------------------------------

let currentVersion = {
  version: process.env.npm_package_version || '0.1.0',
  project: 'CostoBot',
  updatedAt: new Date().toISOString(),
};

/** @type {Array} */
const versionHistoryMemory = [];

// ---------------------------------------------------------------------------
// GET /api/version
// ---------------------------------------------------------------------------
router.get('/', requirePublicKey, async (req, res) => {
  if (getConnectionState()) {
    try {
      const latest = await VersionHistory.findOne({ project: 'CostoBot' }).sort({ pushedAt: -1 });
      if (latest) {
        return res.json({ version: latest.version, project: latest.project, updatedAt: latest.pushedAt });
      }
    } catch (err) {
      logger.error('version_fetch_db_failed', { error: err.message, ip: req.ip });
    }
  }
  res.json({ version: currentVersion.version, project: currentVersion.project, updatedAt: currentVersion.updatedAt });
});

// ---------------------------------------------------------------------------
// POST /api/version/record
// ---------------------------------------------------------------------------
router.post('/record', versionWriteLimiter, requireInternalKey, async (req, res) => {
  const { version, bumpType, message, commitHash, branch, project } = req.body;

  if (!version || !bumpType || !message) {
    logger.warn('version_record_validation_failed', {
      reason: 'missing_required_fields',
      body: { version, bumpType, message: message?.slice(0, 50) },
      ip: req.ip,
    });
    return res.status(400).json({ error: 'Bad Request', message: 'Required fields: version, bumpType, message' });
  }

  const validBumpTypes = ['patch', 'minor', 'major', 'rollback'];
  if (!validBumpTypes.includes(bumpType)) {
    logger.warn('version_record_invalid_bump_type', {
      bumpType,
      ip: req.ip,
    });
    return res.status(400).json({ error: 'Bad Request', message: `bumpType must be one of: ${validBumpTypes.join(', ')}` });
  }

  const entry = {
    version,
    bumpType,
    message,
    commitHash: commitHash || null,
    branch: branch || 'main',
    project: project || 'CostoBot',
    pushedAt: new Date().toISOString(),
  };

  if (getConnectionState()) {
    try {
      await VersionHistory.create(entry);
    } catch (err) {
      logger.error('version_record_db_failed', { error: err.message, version, bumpType, ip: req.ip });
    }
  } else {
    versionHistoryMemory.unshift(entry);
  }

  currentVersion = { version, project: entry.project, updatedAt: entry.pushedAt };
  logger.info('version_recorded', {
    version,
    bumpType,
    project: entry.project,
    branch: entry.branch,
    commitHash: entry.commitHash,
    ip: req.ip,
  });
  res.status(201).json({ ok: true, recorded: entry });
});

// ---------------------------------------------------------------------------
// GET /api/version/history
// ---------------------------------------------------------------------------
router.get('/history', requireInternalKey, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));

  if (getConnectionState()) {
    try {
      const total = await VersionHistory.countDocuments({ project: 'CostoBot' });
      const data  = await VersionHistory.find({ project: 'CostoBot' })
        .sort({ pushedAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      return res.json({ page, limit, total, data });
    } catch (err) {
      logger.error('version_history_db_failed', { error: err.message, ip: req.ip });
    }
  }

  const start = (page - 1) * limit;
  res.json({ page, limit, total: versionHistoryMemory.length, data: versionHistoryMemory.slice(start, start + limit) });
});

module.exports = router;
