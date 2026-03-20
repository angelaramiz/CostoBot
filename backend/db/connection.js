/**
 * connection.js — CostoBot Backend
 * MongoDB Atlas connection via Mongoose.
 * Call connectDB() once at server startup.
 * [GREENFIELD — defined by user]
 */
'use strict';

const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.warn('[DB] DATABASE_URL not set — skipping MongoDB connection (in-memory mode)');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[DB] Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    // Non-fatal: server continues with in-memory fallback
  }
}

function getConnectionState() {
  return isConnected;
}

module.exports = { connectDB, getConnectionState };
