/**
 * openrouter.adapter.js — Adapter para OpenRouter API (cloud).
 * Docs: https://openrouter.ai/docs
 */
'use strict';

const { IIAAdapter } = require('./ia.adapter');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

class OpenRouterAdapter extends IIAAdapter {
  constructor() {
    super();
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  /**
   * @param {import('./ia.adapter').ChatMessage[]} messages
   * @param {import('./ia.adapter').ProjectContext} context
   * @returns {Promise<string>}
   */
  async chat(messages, context) {
    const systemPrompt = buildSystemPrompt(context);

    const payload = {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // max 10 mensajes de historial
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'CostoBot',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter error ${res.status}: ${err.error?.message ?? 'Unknown error'}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('OpenRouter devolvió respuesta vacía');
    return reply;
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

function buildSystemPrompt(context) {
  return `Eres CostoBot, un asistente especializado en análisis de costos para pequeñas y medianas empresas.
Tienes acceso al proyecto "${context.projectName}" con los siguientes datos:
${context.resumen}

Responde siempre en español. Sé conciso y práctico.
Si el usuario pregunta por optimizaciones, sugiere cambios específicos con números.
NO inventes datos que no estén en el contexto proporcionado.`;
}

module.exports = { OpenRouterAdapter, buildSystemPrompt };
