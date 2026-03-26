/**
 * connection.js — CostoBot Backend
 * MongoDB Atlas connection via Mongoose.
 * Call connectDB() once at server startup.
 * [GREENFIELD — defined by user]
 */
'use strict';

const mongoose = require('mongoose');
const logger = require('./lib/logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    logger.warn('db_no_uri', { msg: 'DATABASE_URL not set — skipping MongoDB connection (in-memory mode)' });
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info('db_connected', { provider: 'MongoDB Atlas' });
  } catch (err) {
    logger.error('db_connection_failed', { error: err.message });
    // Non-fatal: server continues with in-memory fallback
  }
}

function getConnectionState() {
  return isConnected;
}

module.exports = { connectDB, getConnectionState };
