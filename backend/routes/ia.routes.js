/**
 * ia.routes.js — CostoBot Backend
 * POST /api/ia/chat — Envía mensajes al modelo de IA con contexto del proyecto.
 *
 * Seguridad:
 *  - Firebase token requerido (verifyFirebaseToken)
 *  - Rate limiting: 20 req / hora por usuario (uid)
 *  - Máx 10 mensajes enviados al modelo
 *  - Nunca se devuelven datos de otro usuario
 */
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken.middleware');
const BusinessProject = require('../db/BusinessProject.model');
const { getIAAdapter } = require('../lib/ia/ia.factory');
const logger = require('../lib/logger');

// ── Rate limiting por usuario (uid) — 20 req/hora ──────────────────────────
const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  keyGenerator: (req) => req.uid || req.ip, // uid disponible tras verifyFirebaseToken
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Límite de 20 mensajes por hora alcanzado.' },
});

// ── GET /api/ia/status — requiere autenticación (información de infraestructura sensible) ──
router.get('/status', verifyFirebaseToken, async (req, res) => {
  try {
    const adapter = getIAAdapter();
    const available = await adapter.isAvailable();
    const provider = process.env.IA_PROVIDER || 'openrouter';
    logger.info('ia_status_checked', {
      userId: req.uid,
      provider,
      available,
      ip: req.ip,
    });
    return res.json({ provider, available });
  } catch (err) {
    logger.error('ia_status_check_failed', {
      userId: req.uid,
      error: err.message,
      ip: req.ip,
    });
    return res.json({ provider: process.env.IA_PROVIDER || 'openrouter', available: false });
  }
});

router.use(verifyFirebaseToken);
router.use(iaLimiter);

// ── POST /api/ia/chat ───────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, projectId, mode = 'project' } = req.body;

  // Validar modo
  const validModes = ['project', 'dashboard', 'onboarding'];
  const chatMode = validModes.includes(mode) ? mode : 'project';

  // En modo dashboard/onboarding no se requiere projectId
  if (chatMode === 'project') {
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId requerido en modo project' });
    }
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] requerido' });
  }

  // Validar estructura de cada mensaje
  const validMessages = messages.filter(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
  );
  if (validMessages.length === 0) {
    return res.status(400).json({ error: 'Mensajes inválidos o vacíos' });
  }

  try {
    let context = null;

    if (chatMode === 'project' && projectId) {
      // Cargar proyecto — ownership check incluido
      const project = await BusinessProject.findOne({
        _id: projectId,
        ownerId: req.uid,
      }).lean();

      if (!project) {
        logger.warn('ia_chat_project_not_found', {
          userId: req.uid,
          projectId,
          ip: req.ip,
        });
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      context = buildProjectContext(project);
    }

    // Llamar al adapter con contexto y modo
    const adapter = getIAAdapter();
    const result = await adapter.chat(validMessages.slice(-10), context, chatMode);

    // El adapter devuelve { content, reasoning_details } o string (adapters legacy)
    const replyText = typeof result === 'string' ? result : result?.content;

    // Validar respuesta
    if (!replyText || replyText.trim().length === 0) {
      throw new Error('La IA devolvió una respuesta vacía');
    }

    logger.info('ia_chat_response', {
      userId: req.uid,
      projectId: projectId || null,
      mode: chatMode,
      messageCount: validMessages.length,
      replyLength: replyText.trim().length,
      ip: req.ip,
    });

    return res.json({
      reply: replyText.trim(),
    });
  } catch (err) {
    logger.error('ia_chat_failed', {
      userId: req.uid,
      projectId: projectId || null,
      mode: chatMode,
      error: err.message,
      ip: req.ip,
    });
    return res.status(502).json({
      error: 'Error al contactar la IA',
      message: err.message,
    });
  }
});



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Genera un resumen textual del proyecto en español para el system prompt.
 * @param {object} project — Documento Mongoose .lean()
 * @returns {import('../lib/ia/ia.adapter').ProjectContext}
 */
function buildProjectContext(project) {
  const layer1 = project.layers?.layer1 ?? [];
  const layer2 = project.layers?.layer2 ?? [];
  const layer3 = project.layers?.layer3 ?? { version: '1.0', services: {}, taxes: {}, products: [] };
  const products = layer3.products ?? [];

  // Top 5 insumos por valor total (costPerUnit * quantity)
  const topInsumos = [...layer1]
    .sort((a, b) => b.costPerUnit * b.quantity - a.costPerUnit * a.quantity)
    .slice(0, 5);

  // Costo promedio de productos (desde pricing en layer3)
  const avgProductCost =
    products.length > 0
      ? Math.round(
          products.reduce((acc, p) => acc + (p.costBreakdown?.totalCost ?? 0), 0) / products.length
        )
      : 0;

  // Margen promedio de precios configurados
  const margenPromedio =
    products.length > 0
      ? products.reduce((acc, p) => acc + (p.margenPorcentaje ?? 0), 0) / products.length
      : 0;

  const resumen = generateResumen(project, topInsumos, avgProductCost, margenPromedio);

  return {
    projectName: project.name,
    avgProductCost,
    topInsumosByValue: topInsumos,
    margenPromedio,
    resumen,
  };
}

function generateResumen(project, topInsumos, avgCost, margenPromedio) {
  const layers = project.layers ?? {};
  const l1 = layers.layer1?.length ?? 0;
  const l2 = layers.layer2?.length ?? 0;
  const products = layers.layer3?.products ?? [];
  const l3 = products.length;

  const lines = [
    `- Insumos registrados: ${l1}`,
    `- Grafos de producto: ${l2}`,
    `- Productos con precio: ${l3} (costo promedio: $${(avgCost / 100).toFixed(2)} MXN)`,
    `- Margen promedio: ${margenPromedio.toFixed(1)}%`,
  ];

  if (topInsumos.length > 0) {
    lines.push('- Top 5 insumos por valor:');
    topInsumos.forEach((i) => {
      const subtotal = ((i.costPerUnit * i.quantity) / 100).toFixed(2);
      lines.push(`  • ${i.name}: $${subtotal} MXN (${i.quantity} ${i.unit} × $${(i.costPerUnit / 100).toFixed(2)})`);
    });
  }

  return lines.join('\n');
}

module.exports = router;
