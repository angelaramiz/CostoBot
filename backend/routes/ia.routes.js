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

// ── Rate limiting por usuario (uid) — 20 req/hora ──────────────────────────
const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  keyGenerator: (req) => req.uid || req.ip, // uid disponible tras verifyFirebaseToken
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Límite de 20 mensajes por hora alcanzado.' },
});

// ── GET /api/ia/status — público, no requiere auth ─────────────────────────
router.get('/status', async (_req, res) => {
  try {
    const adapter = getIAAdapter();
    const available = await adapter.isAvailable();
    const provider = process.env.IA_PROVIDER || 'openrouter';
    return res.json({ provider, available });
  } catch {
    return res.json({ provider: process.env.IA_PROVIDER || 'openrouter', available: false });
  }
});

router.use(verifyFirebaseToken);
router.use(iaLimiter);

// ── POST /api/ia/chat ───────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, projectId } = req.body;

  // Validación básica de entrada
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'projectId requerido' });
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
    // Cargar proyecto — ownership check incluido
    const project = await BusinessProject.findOne({
      _id: projectId,
      ownerId: req.uid,
    }).lean();

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Generar contexto del proyecto para la IA
    const context = buildProjectContext(project);

    // Llamar al adapter
    const adapter = getIAAdapter();
    const reply = await adapter.chat(validMessages.slice(-10), context);

    // Validar respuesta
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('La IA devolvió una respuesta vacía');
    }

    return res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('[IA] Error en /api/ia/chat:', err.message);
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
  const layer3 = project.layers?.layer3 ?? [];
  const layer4 = project.layers?.layer4 ?? [];

  // Top 5 insumos por valor total (costPerUnit * quantity)
  const topInsumos = [...layer1]
    .sort((a, b) => b.costPerUnit * b.quantity - a.costPerUnit * a.quantity)
    .slice(0, 5);

  // Costo unitario promedio de productos (en centavos)
  const totalCostLayer3 =
    layer3.length > 0
      ? Math.round(layer3.reduce((acc, p) => acc + (p.costoUnitario ?? 0), 0) / layer3.length)
      : 0;

  // Margen promedio de precios configurados
  const margenPromedio =
    layer4.length > 0
      ? layer4.reduce((acc, p) => acc + (p.margenPorcentaje ?? 0), 0) / layer4.length
      : 0;

  const resumen = generateResumen(project, topInsumos, totalCostLayer3, margenPromedio);

  return {
    projectName: project.name,
    totalCostLayer3,
    topInsumosByValue: topInsumos,
    margenPromedio,
    resumen,
  };
}

function generateResumen(project, topInsumos, avgCost, margenPromedio) {
  const layers = project.layers ?? {};
  const l1 = layers.layer1?.length ?? 0;
  const l2 = layers.layer2?.length ?? 0;
  const l3 = layers.layer3?.length ?? 0;
  const l4 = layers.layer4?.length ?? 0;

  const lines = [
    `- Insumos registrados: ${l1}`,
    `- Procesos definidos: ${l2}`,
    `- Productos: ${l3} (costo unitario promedio: $${(avgCost / 100).toFixed(2)} MXN)`,
    `- Precios configurados: ${l4} (margen promedio: ${margenPromedio.toFixed(1)}%)`,
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
