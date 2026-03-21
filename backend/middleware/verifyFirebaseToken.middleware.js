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
  } catch {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado.',
    });
  }
}

module.exports = verifyFirebaseToken;
