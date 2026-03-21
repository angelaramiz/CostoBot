/**
 * lmstudio.adapter.js — Adapter para LM Studio (OpenAI-compatible local API).
 * Por defecto escucha en http://localhost:1234/v1
 */
'use strict';

const { IIAAdapter } = require('./ia.adapter');
const { buildSystemPrompt } = require('./openrouter.adapter');

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

class LMStudioAdapter extends IIAAdapter {
  /**
   * @param {import('./ia.adapter').ChatMessage[]} messages
   * @param {import('./ia.adapter').ProjectContext} context
   * @returns {Promise<string>}
   */
  async chat(messages, context) {
    const systemPrompt = buildSystemPrompt(context);

    const payload = {
      model: 'local-model', // LM Studio ignora este campo, usa el modelo cargado
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    const res = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`LM Studio error ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('LM Studio devolvió respuesta vacía');
    return reply;
  }

  async isAvailable() {
    try {
      const res = await fetch(`${LM_STUDIO_URL}/v1/models`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { LMStudioAdapter };
