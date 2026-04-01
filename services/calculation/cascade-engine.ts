import type { BusinessProject } from '@/types/business-project';
import type { Insumo } from '@/types/layer1-insumos';
import type {
  ProductGraph,
  ProductNode,
  IngredientNodeData,
  UtensilNodeData,
  MachineNodeData,
  ResultadoNodeData,
  ImportNodeData,
} from '@/types/layer2-productos';
import type { ProductPricing, CostBreakdown, ServicesConfig } from '@/types/layer3-precios';
import {
  calculateUtensilDepreciation,
  calculateMachineCost,
  calculateInheritedCost,
  calculatePricing,
} from './calculations';
import { buildDependencyGraph, getTopologicalOrder } from './dependency-graph';

type LayerId = 'layer1' | 'layer2' | 'layer3';

// ── Helpers internos ────────────────────────────────────────────────────────

function isIngredientData(node: ProductNode): node is ProductNode & { data: IngredientNodeData } {
  return node.type === 'ingredient';
}
function isUtensilData(node: ProductNode): node is ProductNode & { data: UtensilNodeData } {
  return node.type === 'utensil';
}
function isMachineData(node: ProductNode): node is ProductNode & { data: MachineNodeData } {
  return node.type === 'machine';
}
function isImportData(node: ProductNode): node is ProductNode & { data: ImportNodeData } {
  return node.type === 'import';
}

/**
 * Calcula el desglose de costos de un grafo de producto.
 * @param servicesConfig Tarifas de servicios de Layer 3 (electricidad, agua, gas, etc.)
 */
function calculateGraphCostBreakdown(
  graph: ProductGraph,
  insumos: Insumo[],
  allGraphs: ProductGraph[],
  servicesConfig?: ServicesConfig
): CostBreakdown {
  const insumoMap = new Map(insumos.map((i) => [i.id, i]));
  const graphMap = new Map(allGraphs.map((g) => [g.productId, g]));
  
  // Crear también un mapa de exportedProductId → graph para que imports puedan referenciarlo
  const exportedProductMap = new Map<string, ProductGraph>();
  for (const g of allGraphs) {
    const nodes = Array.isArray(g.nodes) ? g.nodes : [];
    for (const node of nodes) {
      if (node.type === 'export') {
        const exportData = node.data as unknown as Record<string, unknown>;
        const exportedId = exportData.exportedProductId as string;
        if (exportedId) {
          exportedProductMap.set(exportedId, g);
        }
      }
    }
  }

  let ingredients = 0;
  let machines = 0;
  let utensils = 0;
  let services = 0;

  // Validación defensiva: asegurar que nodes y edges son arrays
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  // Construir mapa de conexiones: target → [sources]
  const connectionMap = new Map<string, string[]>();
  for (const edge of edges) {
    if (!connectionMap.has(edge.target)) {
      connectionMap.set(edge.target, []);
    }
    connectionMap.get(edge.target)!.push(edge.source);
  }

  for (const node of nodes) {
    if (isIngredientData(node)) {
      const insumo = insumoMap.get(node.data.insumoId);
      if (insumo) {
        ingredients += Math.round(insumo.costPerUnit * node.data.quantity);
      }
    } else if (isUtensilData(node)) {
      const insumo = insumoMap.get(node.data.insumoId);
      if (insumo && insumo.acquisitionCost && insumo.usefulLifeMonths) {
        utensils += calculateUtensilDepreciation(
          insumo.acquisitionCost,
          insumo.residualValue ?? 0,
          insumo.usefulLifeMonths,
          node.data.unitsProducedThisMonth
        );
      }
    } else if (isMachineData(node)) {
      const insumo = insumoMap.get(node.data.insumoId);
      if (insumo) {
        machines += calculateMachineCost(
          insumo.costPerUnit,
          node.data.timeMinutes
        );
      }
    } else if (isImportData(node)) {
      // Buscar por productId primero, luego por exportedProductId
      let parentGraph = graphMap.get(node.data.sourceProductId);
      if (!parentGraph) {
        parentGraph = exportedProductMap.get(node.data.sourceProductId);
      }
      
      // Validación defensiva para parentGraph.nodes
      if (parentGraph && Array.isArray(parentGraph.nodes)) {
        const resultNode = parentGraph.nodes.find(
          (n) => n.type === 'resultado'
        ) as ProductNode & { data: ResultadoNodeData } | undefined;
        if (resultNode) {
          ingredients += calculateInheritedCost(
            parentGraph.totalCost,
            resultNode.data.mainProduct.expectedQuantity,
            node.data.quantity
          );
        }
      }
    }
  }

  // Calcular costo de servicios a partir del consumo declarado en el grafo
  // Ejemplo: servicesUsage = { electricity: 2.5 } → 2.5 kWh * electricity.baseRate
  if (servicesConfig && graph.servicesUsage) {
    for (const [serviceKey, usage] of Object.entries(graph.servicesUsage)) {
      if (usage <= 0) continue;
      const rate = servicesConfig[serviceKey];
      if (rate) {
        services += Math.round(rate.baseRate * usage);
      }
    }
  }

  const totalCost = ingredients + machines + utensils + services + graph.laborCost;

  return { ingredients, machines, utensils, services, labor: graph.laborCost, totalCost };
}

/**
 * Recalcula el totalCost de un grafo de producto en base a sus nodos, insumos y servicios.
 */
function recalculateProductGraph(
  graph: ProductGraph,
  insumos: Insumo[],
  allGraphs: ProductGraph[],
  servicesConfig?: ServicesConfig
): ProductGraph {
  const breakdown = calculateGraphCostBreakdown(graph, insumos, allGraphs, servicesConfig);
  return { ...graph, totalCost: breakdown.totalCost };
}

/**
 * Recalcula el pricing de un producto en Layer 3, incluyendo el desglose completo de costos.
 */
function recalculateProductPricing(
  pricing: ProductPricing,
  graphs: ProductGraph[],
  insumos: Insumo[],
  servicesConfig?: ServicesConfig
): ProductPricing {
  const graph = graphs.find((g) => g.productId === pricing.productId);
  if (!graph) return pricing;

  const breakdown = calculateGraphCostBreakdown(graph, insumos, graphs, servicesConfig);
  const { precioVenta, ganancia } = calculatePricing(breakdown.totalCost, pricing.margenPorcentaje);

  return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia };
}

// ── API pública ─────────────────────────────────────────────────────────────

/**
 * Aplica un cambio en Layer 1 (insumos) y propaga en cascada a Layer 2 y 3.
 */
export function propagateInsumoChange(
  project: BusinessProject,
  insumoId: string,
  field: string,
  newValue: number | string
): BusinessProject {
  const updated: BusinessProject = structuredClone(project);

  // Aplicar cambio directo en Layer 1
  const idx = updated.layers.layer1.findIndex((i) => i.id === insumoId);
  if (idx === -1) return project;
  (updated.layers.layer1[idx] as unknown as Record<string, unknown>)[field] = newValue;

  // Recalcular grafos de Layer 2 que usen este insumo
  updated.layers.layer2 = updated.layers.layer2.map((graph) => {
    // Validación defensiva: asegurar que nodes es un array
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const usesInsumo = nodes.some((node) => {
      if (isIngredientData(node) || isUtensilData(node) || isMachineData(node)) {
        return node.data.insumoId === insumoId;
      }
      return false;
    });
    if (!usesInsumo) return graph;
    return recalculateProductGraph(
      graph,
      updated.layers.layer1,
      updated.layers.layer2,
      updated.layers.layer3.services
    );
  });

  // Recalcular Layer 3 pricing (incluyendo desglose completo con servicios)
  updated.layers.layer3 = {
    ...updated.layers.layer3,
    updatedAt: new Date().toISOString(),
    products: updated.layers.layer3.products.map((pricing) =>
      recalculateProductPricing(
        pricing,
        updated.layers.layer2,
        updated.layers.layer1,
        updated.layers.layer3.services
      )
    ),
  };

  updated.updatedAt = new Date();
  return updated;
}

/**
 * Aplica un cambio en un grafo de producto (Layer 2) y propaga a Layer 3 y otros productos que dependan.
 * Usa buildDependencyGraph para encontrar y recalcular todos los dependientes (ej: productos que importan).
 */
export function propagateGraphChange(
  project: BusinessProject,
  productId: string,
  updatedGraph: ProductGraph
): BusinessProject {
  const updated: BusinessProject = structuredClone(project);

  const idx = updated.layers.layer2.findIndex((g) => g.productId === productId);
  if (idx === -1) return project;

  // Recalcular el grafo actualizado
  updated.layers.layer2[idx] = recalculateProductGraph(
    updatedGraph,
    updated.layers.layer1,
    updated.layers.layer2,
    updated.layers.layer3.services
  );

  // Construir grafo de dependencias y obtener todos los productos que dependen de este
  const depGraph = buildDependencyGraph(updated);
  const dependents = getTopologicalOrder(depGraph, productId);
  
  // Recalcular todos los grafos dependientes (productos que importan de este)
  const dependentGraphIds = dependents.filter((id) => {
    // Solo son grafos los IDs sin sufijo ':pricing'
    return !id.includes(':');
  });

  for (const depGraphId of dependentGraphIds) {
    const depIdx = updated.layers.layer2.findIndex((g) => g.productId === depGraphId);
    if (depIdx === -1) continue;
    
    updated.layers.layer2[depIdx] = recalculateProductGraph(
      updated.layers.layer2[depIdx],
      updated.layers.layer1,
      updated.layers.layer2,
      updated.layers.layer3.services
    );
  }

  // Recalcular Layer 3 para todos los productos afectados (originalId + dependientes)
  const affectedProductIds = new Set([productId, ...dependentGraphIds]);
  updated.layers.layer3 = {
    ...updated.layers.layer3,
    updatedAt: new Date().toISOString(),
    products: updated.layers.layer3.products.map((pricing) => {
      if (!affectedProductIds.has(pricing.productId)) return pricing;

      const graphIdx = updated.layers.layer2.findIndex((g) => g.productId === pricing.productId);
      if (graphIdx === -1) return pricing;

      const graph = updated.layers.layer2[graphIdx];
      const breakdown = calculateGraphCostBreakdown(
        graph,
        updated.layers.layer1,
        updated.layers.layer2,
        updated.layers.layer3.services
      );
      const { precioVenta, ganancia } = calculatePricing(
        breakdown.totalCost,
        pricing.margenPorcentaje
      );
      return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia };
    }),
  };

  updated.updatedAt = new Date();
  return updated;
}

/**
 * Aplica un cambio en Layer 3 (pricing: margen, servicios, impuestos).
 */
export function propagatePricingChange(
  project: BusinessProject,
  productId: string,
  field: string,
  newValue: number | string
): BusinessProject {
  const updated: BusinessProject = structuredClone(project);

  const pIdx = updated.layers.layer3.products.findIndex(
    (p) => p.productId === productId
  );
  if (pIdx === -1) return project;

  (updated.layers.layer3.products[pIdx] as unknown as Record<string, unknown>)[field] = newValue;

  // Recalcular precioVenta y ganancia
  const pricing = updated.layers.layer3.products[pIdx];
  const { precioVenta, ganancia } = calculatePricing(
    pricing.costBreakdown.totalCost,
    pricing.margenPorcentaje
  );
  updated.layers.layer3.products[pIdx] = { ...pricing, precioVenta, ganancia };
  updated.layers.layer3.updatedAt = new Date().toISOString();

  updated.updatedAt = new Date();
  return updated;
}

/**
 * Wrapper de compatibilidad: propaga un cambio genérico por layerId.
 * Usa las funciones específicas según la capa.
 */
export function propagateChange(
  project: BusinessProject,
  layerId: LayerId,
  itemId: string,
  field: string,
  newValue: number | string
): BusinessProject {
  switch (layerId) {
    case 'layer1':
      return propagateInsumoChange(project, itemId, field, newValue);
    case 'layer3':
      return propagatePricingChange(project, itemId, field, newValue);
    default:
      return project;
  }
}

/**
 * Recalcula todas las capas del proyecto desde cero.
 * Usar tras cambios estructurales (agregar / eliminar ítems).
 */
export function recalculateAllLayers(project: BusinessProject): BusinessProject {
  const updated = structuredClone(project) as BusinessProject;

  // Recalcular todos los grafos de Layer 2
  updated.layers.layer2 = updated.layers.layer2.map((graph) =>
    recalculateProductGraph(
      graph,
      updated.layers.layer1,
      updated.layers.layer2,
      updated.layers.layer3.services
    )
  );

  // Recalcular todos los pricings de Layer 3
  updated.layers.layer3 = {
    ...updated.layers.layer3,
    updatedAt: new Date().toISOString(),
    products: updated.layers.layer3.products.map((pricing) => {
      const graph = updated.layers.layer2.find(
        (g) => g.productId === pricing.productId
      );
      if (!graph) return pricing;

      const breakdown = calculateGraphCostBreakdown(
        graph,
        updated.layers.layer1,
        updated.layers.layer2,
        updated.layers.layer3.services
      );
      const { precioVenta, ganancia } = calculatePricing(
        breakdown.totalCost,
        pricing.margenPorcentaje
      );
      return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia };
    }),
  };

  updated.updatedAt = new Date();
  return updated;
}
