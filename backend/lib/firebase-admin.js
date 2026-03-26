/**
 * firebase-admin.js — CostoBot Backend
 * Firebase Admin SDK — inicializa una sola vez (singleton).
 * Usado para verificar JWT tokens del frontend en cada request autenticado.
 * [GREENFIELD — defined by user]
 */
'use strict';

const admin = require('firebase-admin');

const logger = require('./logger');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    logger.warn('firebase_admin_no_credentials', { msg: 'Credentials not set — auth middleware will be disabled' });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
    logger.info('firebase_admin_initialized', { projectId: process.env.FIREBASE_ADMIN_PROJECT_ID });
  }
}

module.exports = admin;
