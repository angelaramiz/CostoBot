/**
 * connection.js — CostoBot Backend
 * MongoDB Atlas connection via Mongoose.
 * Call connectDB() once at server startup.
 * [GREENFIELD — defined by user]
 */
'use strict';

const mongoose = require('mongoose');
const logger = require('../lib/logger');

let isConnected = false;
let lastError = null;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    lastError = 'DATABASE_URL not set';
    logger.warn('db_no_uri', { msg: lastError + ' — skipping MongoDB connection (in-memory mode)' });
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    lastError = null;
    logger.info('db_connected', { provider: 'MongoDB Atlas' });
  } catch (err) {
    lastError = err.message;
    logger.error('db_connection_failed', { error: err.message, code: err.code });
    // Non-fatal: server continues with in-memory fallback
  }
}

function getConnectionState() {
  return isConnected;
}

function getLastError() {
  return lastError;
}

function requireDB() {
  if (!isConnected) {
    const reason = lastError || 'unknown';
    const err = new Error(`Database not available: ${reason}`);
    err.status = 503;
    err.code = 'DB_UNAVAILABLE';
    throw err;
  }
}

module.exports = { connectDB, getConnectionState, getLastError, requireDB };
