import type { BusinessProject } from '@/types/business-project';

/**
 * Grafo de dependencias: key = ID del ítem, value = conjunto de IDs que dependen de él.
 * Cuando cambia el ítem con `key`, todos los IDs en `value` deben recalcularse.
 */
export type DependencyGraph = Map<string, Set<string>>;

/**
 * Construye el grafo de dependencias hacia adelante para un BusinessProject.
 * Insumo → Proceso → Producto → Precio
 */
export function buildDependencyGraph(project: BusinessProject): DependencyGraph {
  const graph: DependencyGraph = new Map();

  // Inicializar todos los IDs en el grafo
  for (const insumo of project.layers.layer1) {
    graph.set(insumo.id, new Set());
  }
  for (const proceso of project.layers.layer2) {
    graph.set(proceso.id, new Set());
  }
  for (const producto of project.layers.layer3) {
    graph.set(producto.id, new Set());
  }
  for (const precio of project.layers.layer4) {
    graph.set(precio.id, new Set());
  }

  // Layer1 → Layer2: insumo → procesos que lo usan
  for (const proceso of project.layers.layer2) {
    for (const insumoId of proceso.insumoIds) {
      if (!graph.has(insumoId)) graph.set(insumoId, new Set());
      graph.get(insumoId)!.add(proceso.id);
    }
  }

  // Layer2 → Layer3: proceso → productos que lo usan
  for (const producto of project.layers.layer3) {
    for (const procesoId of producto.procesoIds) {
      if (!graph.has(procesoId)) graph.set(procesoId, new Set());
      graph.get(procesoId)!.add(producto.id);
    }
  }

  // Layer3 → Layer4: producto → precios que lo referencian
  for (const precio of project.layers.layer4) {
    if (!graph.has(precio.productoId)) graph.set(precio.productoId, new Set());
    graph.get(precio.productoId)!.add(precio.id);
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
