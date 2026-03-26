/**
 * openrouter.adapter.js — Adapter para OpenRouter API (cloud).
 * Docs: https://openrouter.ai/docs
 */
'use strict';

const { IIAAdapter } = require('./ia.adapter');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modelo activo. Se puede sobreescribir con la variable de entorno OPENROUTER_MODEL.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

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

    // Construir historial preservando reasoning_details si existen
    const history = messages.slice(-10).map((m) => {
      const msg = { role: m.role, content: m.content };
      if (m.reasoning_details) msg.reasoning_details = m.reasoning_details;
      return msg;
    });

    const payload = {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 4096,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

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
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter error ${res.status}: ${err.error?.message ?? 'Unknown error'}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (!message?.content) {
      throw new Error('OpenRouter devolvió respuesta vacía');
    }

    // Devolver objeto con content + reasoning_details para preservar en historial
    return {
      content: message.content,
      reasoning_details: message.reasoning_details ?? null,
    };
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
4. Explica brevemente las 3 capas de CostoBot y cómo le ayudarán.
5. Ofrece crear su primer proyecto guiado.

CAPAS DE COSTOBOT (explica de forma simple):
- Capa 1 — Insumos: ingredientes, materiales, utensilios y maquinaria que usas para producir.
- Capa 2 — Productos: grafos visuales que conectan tus insumos para calcular el costo de cada producto.
- Capa 3 — Precios: servicios, impuestos, margen de ganancia y precio de venta.

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
1. Responder dudas sobre cómo usar CostoBot y sus 3 capas.
2. Ayudar a decidir el tipo de proyecto (fabricación con receta vs reventa).
3. Guiar en la creación de un nuevo proyecto.
4. Explicar conceptos de costos, márgenes, punto de equilibrio.

CAPAS DE COSTOBOT:
- Capa 1 — Insumos 📦: ingredientes, materiales, utensilios y maquinaria. Registra nombre, unidad, cantidad, costo y categoría.
- Capa 2 — Productos 🔗: grafos visuales de nodos que conectan insumos para calcular el costo total de cada producto.
- Capa 3 — Precios 💰: servicios, impuestos, margen de ganancia y precio de venta final.

TIPOS DE PROYECTO:
- FABRICADO (con receta): tienes ingredientes/materiales → defines grafo de producto → calculas costo de producción. Ejemplo: panadería, cosméticos artesanales, ropa de diseño.
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
