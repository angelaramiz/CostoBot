/**
 * normalize-layers.ts — CostoBot
 * Normaliza datos de capas para evitar undefined/null y garantizar estructura correcta
 * 🛡️ Defensive validation on data serialization
 */

import type { ProjectLayers } from '@/types/business-project';

/**
 * Normaliza layer1 para garantizar que es un array
 */
function normalizeLayer1(layer1: unknown): any[] {
  if (Array.isArray(layer1)) {
    return layer1.filter((item) => item !== null && item !== undefined);
  }
  return [];
}

/**
 * Normaliza layer2 (ProductGraph array) para garantizar estructura correcta
 */
function normalizeLayer2(layer2: unknown): any[] {
  if (!Array.isArray(layer2)) {
    return [];
  }

  return layer2
    .filter((item) => item !== null && item !== undefined)
    .map((graph: any) => ({
      productId: String(graph.productId ?? ''),
      productName: String(graph.productName ?? ''),
      version: String(graph.version ?? '1.0'),
      // ⚠️ CRITICAL: Garantizar que nodes/edges sean siempre arrays
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
      edges: Array.isArray(graph.edges) ? graph.edges : [],
      totalCost:
        typeof graph.totalCost === 'number' && graph.totalCost >= 0
          ? graph.totalCost
          : 0,
      laborCost:
        typeof graph.laborCost === 'number' && graph.laborCost >= 0
          ? graph.laborCost
          : 0,
      servicesUsage: graph.servicesUsage
        ? (graph.servicesUsage as Record<string, number>)
        : undefined,
    }));
}

/**
 * Normaliza layer3 (Layer3Precios) para garantizar estructura correcta
 */
function normalizeLayer3(layer3: unknown): any {
  const layer3Obj = layer3 && typeof layer3 === 'object' ? layer3 : {};
  const l3 = layer3Obj as any;

  return {
    version: String(l3.version ?? '1.0'),
    updatedAt: String(l3.updatedAt ?? new Date().toISOString()),
    // Preservar services y taxes como están (estructura compleja con opcional propiedades)
    services:
      l3.services && typeof l3.services === 'object'
        ? l3.services
        : {},
    taxes: l3.taxes && typeof l3.taxes === 'object' ? l3.taxes : {},
    // Preservar extraCosts (gastos extra: laborCost, packagingShipping, other)
    extraCosts:
      l3.extraCosts && typeof l3.extraCosts === 'object'
        ? l3.extraCosts
        : {},
    // ⚠️ CRITICAL: Garantizar que products sea siempre un array
    products: Array.isArray(l3.products) ? l3.products : [],
  };
}

/**
 * Normaliza todas las capas del proyecto
 * Garantiza que la estructura es correcta antes de enviar al backend
 */
export function normalizeProjectLayers(layers: ProjectLayers): ProjectLayers {
  return {
    layer1: normalizeLayer1(layers.layer1),
    layer2: normalizeLayer2(layers.layer2),
    layer3: normalizeLayer3(layers.layer3),
  };
}
