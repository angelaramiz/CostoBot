import type { BusinessProject } from '@/types/business-project';
import type { ProductNode } from '@/types/layer2-productos';

/**
 * Grafo de dependencias: key = ID del ítem, value = conjunto de IDs que dependen de él.
 * Cuando cambia el ítem con `key`, todos los IDs en `value` deben recalcularse.
 */
export type DependencyGraph = Map<string, Set<string>>;

/**
 * Construye el grafo de dependencias hacia adelante para un BusinessProject.
 * Nueva arquitectura de 3 capas:
 *   Insumo → ProductGraph (nodos que lo referencian) → ProductPricing
 */
export function buildDependencyGraph(project: BusinessProject): DependencyGraph {
  const graph: DependencyGraph = new Map();

  // Inicializar todos los IDs de insumos
  for (const insumo of project.layers.layer1) {
    graph.set(insumo.id, new Set());
  }

  // Inicializar todos los IDs de grafos de productos
  for (const productGraph of project.layers.layer2) {
    graph.set(productGraph.productId, new Set());
  }

  // Inicializar IDs de pricings
  for (const pricing of project.layers.layer3.products) {
    graph.set(pricing.productId + ':pricing', new Set());
  }

  // Layer1 → Layer2: insumo → grafos de productos que lo usan
  for (const productGraph of project.layers.layer2) {
    for (const node of productGraph.nodes) {
      const data = node.data as unknown as Record<string, unknown>;
      if ('insumoId' in data && typeof data['insumoId'] === 'string') {
        const insumoId = data['insumoId'];
        if (!graph.has(insumoId)) graph.set(insumoId, new Set());
        graph.get(insumoId)!.add(productGraph.productId);
      }
    }

    // Import nodes: producto padre → este producto
    for (const node of productGraph.nodes) {
      if (node.type === 'import') {
        const importData = node.data as { sourceProductId: string };
        if (!graph.has(importData.sourceProductId)) {
          graph.set(importData.sourceProductId, new Set());
        }
        graph.get(importData.sourceProductId)!.add(productGraph.productId);
      }
    }
  }

  // Layer2 → Layer3: grafo de producto → pricing
  for (const pricing of project.layers.layer3.products) {
    if (!graph.has(pricing.productId)) graph.set(pricing.productId, new Set());
    graph.get(pricing.productId)!.add(pricing.productId + ':pricing');
  }

  return graph;
}

/**
 * Devuelve los IDs dependientes en orden topológico (BFS) desde un nodo inicial.
 * El nodo inicial no se incluye en el resultado.
 */
export function getTopologicalOrder(graph: DependencyGraph, startId: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);

    const dependents = graph.get(current);
    if (dependents) {
      for (const dep of dependents) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  // Excluir el nodo inicial
  return result.slice(1);
}
