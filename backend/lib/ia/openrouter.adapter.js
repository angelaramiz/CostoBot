/**
 * openrouter.adapter.js — Adapter para OpenRouter API (cloud).
 * Docs: https://openrouter.ai/docs
 */
'use strict';

const { IIAAdapter } = require('./ia.adapter');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modelos gratuitos disponibles en OpenRouter (en orden de preferencia).
// Se puede sobreescribir con la variable de entorno OPENROUTER_MODEL.
const FREE_MODELS = [
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'google/gemma-3-27b-it:free',
];
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || FREE_MODELS[0];

class OpenRouterAdapter extends IIAAdapter {
  constructor() {
    super();
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  /**
   * @param {import('./ia.adapter').ChatMessage[]} messages
   * @param {import('./ia.adapter').ProjectContext | null} context
   * @param {'project'|'dashboard'|'onboarding'} mode
   * @returns {Promise<string>}
   */
  async chat(messages, context, mode = 'project') {
    const systemPrompt = buildSystemPrompt(context, mode);

    const basePayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    // Intentar con el modelo configurado y, si falla, probar el fallback gratuito
    const modelsToTry =
      DEFAULT_MODEL === FREE_MODELS[0]
        ? FREE_MODELS
        : [DEFAULT_MODEL, ...FREE_MODELS];

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25_000); // 25s por modelo

        let res;
        try {
          res = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
              'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
              'X-Title': 'CostoBot',
            },
            body: JSON.stringify({ ...basePayload, model }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          lastError = new Error(`OpenRouter error ${res.status} (${model}): ${err.error?.message ?? 'Unknown error'}`);
          console.warn(`[IA] Modelo ${model} falló (${res.status}), probando siguiente...`);
          continue; // intentar siguiente modelo
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (!reply) {
          lastError = new Error(`OpenRouter devolvió respuesta vacía (${model})`);
          continue;
        }
        return reply;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error('Todos los modelos de OpenRouter fallaron');
  }

  async isAvailable() {
    if (!this.apiKey) return false;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

function buildSystemPrompt(context, mode = 'project') {
  if (mode === 'onboarding') {
    return `Eres CostoBot, un asistente amigable especializado en ayudar a emprendedores latinoamericanos a estructurar los costos de sus negocios.

Tu rol en esta conversación es dar la BIENVENIDA al usuario y conocer su negocio mediante preguntas amigables.

FLUJO DE BIENVENIDA:
1. Saluda con calidez por su nombre si lo tienes, presenta CostoBot brevemente.
2. Pregunta el nombre o tipo de su negocio.
3. Pregunta qué vende o produce (producto fabricado / producto de reventa / servicio).
4. Explica brevemente las 4 capas de CostoBot y cómo le ayudarán.
5. Ofrece crear su primer proyecto guiado.

CAPAS DE COSTOBOT (explica de forma simple):
- Capa 1 — Insumos: materias primas, ingredientes, materiales que usas para producir.
- Capa 2 — Procesos: pasos de producción con tiempos, mano de obra, energía.
- Capa 3 — Productos: productos terminados con su costo total calculado.
- Capa 4 — Precios: precio de venta, margen de ganancia, punto de equilibrio.

REGLAS:
- Usa un tono cálido, cercano y motivador.
- Responde siempre en español.
- Sé conciso (máx 3-4 oraciones por mensaje).
- NO hables de código ni tecnología.
- Si el usuario quiere crear un proyecto, dile que presione el botón "+ Nuevo proyecto" del dashboard.`;
  }

  if (mode === 'dashboard') {
    return `Eres CostoBot, un asistente experto en costos de negocios para emprendedores latinoamericanos.

Estás en el DASHBOARD del usuario. Tu rol es:
1. Responder dudas sobre cómo usar CostoBot y sus 4 capas.
2. Ayudar a decidir el tipo de proyecto (fabricación con receta vs reventa).
3. Guiar en la creación de un nuevo proyecto.
4. Explicar conceptos de costos, márgenes, punto de equilibrio.

CAPAS DE COSTOBOT:
- Capa 1 — Insumos 📦: ingredientes, materiales, materias primas. Registra nombre, unidad, cantidad y costo.
- Capa 2 — Procesos ⚙️: pasos de producción. Cada proceso usa insumos y agrega tiempo/mano de obra.
- Capa 3 — Productos 📦: productos terminados. El costo se calcula automáticamente desde capas 1 y 2.
- Capa 4 — Precios 💰: define precio de venta, margen % y punto de equilibrio.

TIPOS DE PROYECTO:
- FABRICADO (con receta): tienes ingredientes/materiales → defines proceso → calculas costo de producción. Ejemplo: panadería, cosméticos artesanales, ropa de diseño.
- REVENTA (retail): compras productos ya hechos y los vendes. Solo necesitas costo de compra + gastos operativos + precio de venta.
- SERVICIO: cobras por tiempo/expertise. Incluye costos de herramientas, tiempo, gastos fijos.

CÓMO AYUDAR:
- Si el usuario no sabe por dónde empezar: pregunta qué vende/produce.
- Si quiere crear un proyecto: dile que use el botón "+ Nuevo proyecto" y que vuelva aquí para continuar con la guía.
- Si tiene dudas sobre una capa específica: explica con un ejemplo práctico.

Responde siempre en español. Sé conciso y práctico. Usa ejemplos del mundo real.`;
  }

  // mode === 'project' (default)
  return `Eres CostoBot, un asistente especializado en análisis de costos para pequeñas y medianas empresas.
Tienes acceso al proyecto "${context?.projectName ?? 'sin nombre'}" con los siguientes datos:
${context?.resumen ?? 'Sin datos de proyecto aún.'}

Responde siempre en español. Sé conciso y práctico.
Si el usuario pregunta por optimizaciones, sugiere cambios específicos con números.
NO inventes datos que no estén en el contexto proporcionado.`;
}

module.exports = { OpenRouterAdapter, buildSystemPrompt };
