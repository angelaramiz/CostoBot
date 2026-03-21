/**
 * ollama.adapter.js — Adapter para Ollama (local inference server).
 * Por defecto escucha en http://localhost:11434
 * API docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 */
'use strict';

const { IIAAdapter } = require('./ia.adapter');
const { buildSystemPrompt } = require('./openrouter.adapter');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

class OllamaAdapter extends IIAAdapter {
  /**
   * @param {import('./ia.adapter').ChatMessage[]} messages
   * @param {import('./ia.adapter').ProjectContext} context
   * @returns {Promise<string>}
   */
  async chat(messages, context) {
    const systemPrompt = buildSystemPrompt(context);

    // Ollama usa el formato de chat /api/chat (compatible con mensajes)
    const payload = {
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
      stream: false,
      options: { temperature: 0.7, num_predict: 1024 },
    };

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}`);
    }

    const data = await res.json();
    const reply = data.message?.content;
    if (!reply) throw new Error('Ollama devolvió respuesta vacía');
    return reply;
  }

  async isAvailable() {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { OllamaAdapter };
