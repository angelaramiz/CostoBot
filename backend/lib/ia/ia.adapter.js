/**
 * ia.adapter.js — Interface base para los adaptadores de IA.
 * Todos los adapters deben implementar estos métodos.
 */
'use strict';

/**
 * @typedef {Object} ChatMessage
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @typedef {Object} ProjectContext
 * @property {string} projectName
 * @property {number} avgProductCost — costo promedio de productos en centavos
 * @property {Array} topInsumosByValue — top 5 insumos más caros
 * @property {number} margenPromedio
 * @property {number} avgRoi — ROI promedio de productos con precio configurado
 * @property {string} industry — industria detectada (e.g. 'panaderia', 'cosmeticos', 'default')
 * @property {string} resumen
 */

/**
 * Clase base / interface. Los adapters concretos deben extenderla.
 */
class IIAAdapter {
  /**
   * Envía mensajes a la IA y retorna la respuesta como string.
   * @param {ChatMessage[]} messages
   * @param {ProjectContext} context
   * @returns {Promise<string | { content: string, reasoning_details?: unknown }>}
   */
  async chat(_messages, _context) {
    throw new Error('chat() not implemented');
  }

  /**
   * Verifica si el proveedor está disponible.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return false;
  }
}

module.exports = { IIAAdapter };
