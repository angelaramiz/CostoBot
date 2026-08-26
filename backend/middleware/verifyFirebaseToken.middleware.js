/**
 * verifyFirebaseToken.middleware.js — CostoBot Backend
 * Verifica el JWT de Firebase en el header Authorization: Bearer <token>
 * Agrega req.uid con el Firebase UID del usuario autenticado.
 *
 * Uso:
 *   const verifyFirebaseToken = require('../middleware/verifyFirebaseToken.middleware');
 *   router.get('/projects', verifyFirebaseToken, projectController.list);
 */
'use strict';

const admin = require('../lib/firebase-admin');
const logger = require('../lib/logger');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Se requiere un token de autenticación (Authorization: Bearer <token>).',
    });
  }

  const token = authHeader.slice(7);

  // Si Firebase Admin no está inicializado (dev sin credenciales), rechazar igual
  if (!admin.apps.length) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'El servicio de autenticación no está configurado.',
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    logger.warn('auth_token_invalid', {
      ip,
      userAgent: req.headers['user-agent'] || '-',
      reason: err.code || 'unknown',
      path: req.path,
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado.',
    });
  }
}

// Express 4 no captura promesas rechazadas en middleware async.
// Este wrapper asegura que errores no capturados lleguen al error handler.
function verifyFirebaseTokenSafe(req, res, next) {
  return verifyFirebaseToken(req, res, next).catch(next);
}

module.exports = verifyFirebaseTokenSafe;
