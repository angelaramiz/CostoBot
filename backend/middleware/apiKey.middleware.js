/**
 * apiKey.middleware.js — CostoBot
 * Validates the X-API-Key header on protected backend routes.
 *
 * Public routes  → require PUBLIC_API_KEY  (visible in frontend)
 * Internal routes → require INTERNAL_API_KEY (backend-only)
 *
 * Usage:
 *   const { requirePublicKey, requireInternalKey } = require('../middleware/apiKey.middleware');
 *   router.get('/version', requirePublicKey, versionController.getVersion);
 *   router.post('/version/record', requireInternalKey, versionController.recordVersion);
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const PUBLIC_KEY    = process.env.PUBLIC_API_KEY    || '';
const INTERNAL_KEY  = process.env.INTERNAL_API_KEY  || '';

if (!PUBLIC_KEY || !INTERNAL_KEY) {
  console.warn(
    '[apiKey.middleware] WARNING: PUBLIC_API_KEY or INTERNAL_API_KEY not set. ' +
    'All API key checks will FAIL until .env is configured.'
  );
}

/**
 * Validates a key constant-time to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Middleware: requires PUBLIC_API_KEY in X-API-Key header.
 * Used on read-only endpoints accessible from the frontend.
 */
function requirePublicKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !safeCompare(key, PUBLIC_KEY)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key.',
    });
  }
  next();
}

/**
 * Middleware: requires INTERNAL_API_KEY in X-API-Key header.
 * Used on write endpoints that must not be reachable from the browser.
 */
function requireInternalKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !safeCompare(key, INTERNAL_KEY)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing internal API key.',
    });
  }
  next();
}

module.exports = { requirePublicKey, requireInternalKey };
