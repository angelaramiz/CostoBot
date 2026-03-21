/**
 * ia.factory.js — Selecciona el adapter de IA según la variable IA_PROVIDER.
 * Valores: 'openrouter' (default) | 'lmstudio' | 'ollama'
 */
'use strict';

const { OpenRouterAdapter } = require('./openrouter.adapter');
const { LMStudioAdapter } = require('./lmstudio.adapter');
const { OllamaAdapter } = require('./ollama.adapter');

/**
 * @returns {import('./ia.adapter').IIAAdapter}
 */
function createIAAdapter() {
  const provider = (process.env.IA_PROVIDER || 'openrouter').toLowerCase();

  switch (provider) {
    case 'lmstudio':
      return new LMStudioAdapter();
    case 'ollama':
      return new OllamaAdapter();
    case 'openrouter':
    default:
      return new OpenRouterAdapter();
  }
}

// Singleton — una instancia por proceso
let _adapter = null;

function getIAAdapter() {
  if (!_adapter) _adapter = createIAAdapter();
  return _adapter;
}

module.exports = { getIAAdapter };
