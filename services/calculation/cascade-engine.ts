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
import type { ProductPricing, CostBreakdown, ServicesConfig, TaxesConfig, TaxConfig, ExtraCosts } from '@/types/layer3-precios';
import {
  calculateUtensilDepreciation,
  calculateMachineCost,
  calculateMachineServiceCost,
  calculateMaterialCost,
  calculateInheritedCost,
  calculatePricing,
} from './calculations';
import { calculateIngredientCost } from '@/lib/units';
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
): CostBreakdown & { unitsPerBatch?: number } {
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
        const qtyUnit = (node.data as IngredientNodeData).unit || insumo.unit;
        ingredients += calculateIngredientCost(insumo.costPerUnit, insumo.unit, node.data.quantity, qtyUnit);
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
        if (node.data.serviceType && servicesConfig) {
          // Cálculo por tipo de servicio (electricidad/gas) usando tarifas de Layer 3
          machines += calculateMachineServiceCost(
            node.data.serviceType,
            node.data.timeMinutes,
            node.data.powerKw ?? 0,
            node.data.gasM3PerHour ?? 0,
            servicesConfig.electricity?.baseRate ?? 0,
            servicesConfig.gas?.baseRate ?? 0
          );
        } else {
          // Fallback: costo genérico usando insumo.costPerUnit como tarifa/hora
          machines += calculateMachineCost(
            insumo.costPerUnit,
            node.data.timeMinutes
          );
        }
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
          if (parentGraph.unitsPerBatch && parentGraph.unitsPerBatch > 0) {
            // Producto empacado: el import se mide en unidades (piezas/envases)
            // Costo por unidad = totalCost / unitsPerBatch
            ingredients += Math.round(
              (parentGraph.totalCost / parentGraph.unitsPerBatch) * node.data.quantity
            );
          } else {
            // Sin empaque: el import se mide en las mismas unidades que expectedQuantity
            ingredients += calculateInheritedCost(
              parentGraph.totalCost,
              resultNode.data.mainProduct.expectedQuantity,
              node.data.quantity
            );
          }
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

  const rawCost = ingredients + machines + utensils + services + graph.laborCost;

  // Aplicar rendimiento (yield) del nodo Resultado para ajustar el costo efectivo.
  // Si yield=0.8 → se pierde 20% de insumos, por lo que cada unidad cuesta más.
  // Fórmula: costoPorUnidad = rawCost / yield
  const resultadoNode = nodes.find((n) => n.type === 'resultado');
  const resultadoTyped = resultadoNode
    ? (resultadoNode as ProductNode & { data: ResultadoNodeData })
    : undefined;
  const yieldValue = resultadoTyped?.data.yield ?? 1;
  const effectiveYield = yieldValue > 0 ? yieldValue : 1;
  const costWithYield = effectiveYield < 1
    ? Math.round(rawCost / effectiveYield)
    : rawCost;

  // Calcular costo de empaque (packaging) si el nodo Resultado tiene material vinculado.
  // El empaque se suma DESPUÉS del ajuste de yield: los envases no se pierden con el rendimiento.
  let packaging = 0;
  let unitsPerBatch: number | undefined;
  if (resultadoTyped?.data.packagingMaterialId && resultadoTyped.data.packagingCapacity) {
    const packInsumo = insumoMap.get(resultadoTyped.data.packagingMaterialId);
    const capacity = resultadoTyped.data.packagingCapacity;
    const batchQty = resultadoTyped.data.mainProduct.expectedQuantity;
    if (packInsumo && capacity > 0 && batchQty > 0) {
      unitsPerBatch = Math.floor(batchQty / capacity);
      if (unitsPerBatch > 0) {
        packaging = Math.round(unitsPerBatch * packInsumo.costPerUnit);
      }
    }
  }

  const totalCost = costWithYield + packaging;

  return { ingredients, machines, utensils, services, labor: graph.laborCost, packaging, totalCost, unitsPerBatch };
}

/**
 * Distribuye extraCosts (mano de obra, empaque/envío, otros) proporcionalmente entre productos
 * según el peso del costo de cada uno respecto al total de todos los grafos.
 * Muta el breakdown en lugar.
 */
function applyExtraCostsToBreakdown(
  breakdown: CostBreakdown,
  productTotalCost: number,
  allGraphs: ProductGraph[],
  extraCosts?: ExtraCosts
): void {
  if (!extraCosts) return;
  if (!(extraCosts.laborCost || extraCosts.packagingShipping || extraCosts.other)) return;
  const totalAllCosts = allGraphs.reduce((sum, g) => sum + (g.totalCost ?? 0), 0);
  const share = totalAllCosts > 0
    ? productTotalCost / totalAllCosts
    : allGraphs.length > 0 ? 1 / allGraphs.length : 1;
  const laborShare = Math.round((extraCosts.laborCost ?? 0) * share);
  const packagingShare = Math.round((extraCosts.packagingShipping ?? 0) * share);
  const otherShare = Math.round((extraCosts.other ?? 0) * share);
  breakdown.labor += laborShare;
  breakdown.packaging = (breakdown.packaging ?? 0) + packagingShare;
  breakdown.totalCost += laborShare + packagingShare + otherShare;
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
  return {
    ...graph,
    totalCost: breakdown.totalCost,
    unitsPerBatch: breakdown.unitsPerBatch,
    packagingCost: breakdown.packaging,
  };
}

/**
 * Recalcula el pricing de un producto en Layer 3, incluyendo el desglose completo de costos.
 */
function recalculateProductPricing(
  pricing: ProductPricing,
  graphs: ProductGraph[],
  insumos: Insumo[],
  servicesConfig?: ServicesConfig,
  taxesConfig?: TaxesConfig,
  extraCosts?: ExtraCosts
): ProductPricing {
  const graph = graphs.find((g) => g.productId === pricing.productId);
  if (!graph) return pricing;

  const breakdown = calculateGraphCostBreakdown(graph, insumos, graphs, servicesConfig);
  applyExtraCostsToBreakdown(breakdown, graph.totalCost ?? 0, graphs, extraCosts);

  // Calcular tasa total de impuestos habilitados
  const taxRate = taxesConfig
    ? Object.values(taxesConfig)
        .filter((t): t is TaxConfig => !!t && t.enabled)
        .reduce((sum, t) => sum + t.rate, 0)
    : 0;

  const { precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi } = calculatePricing(
    breakdown.totalCost,
    pricing.margenPorcentaje,
    taxRate
  );

  return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi };
}

/**
 * Sincroniza productos de Layer 2 hacia Layer 3.
 * Si un grafo L2 no tiene entry en L3.products, crea una con margen 30% por defecto.
 * Muta el objeto updated (que ya es un structuredClone seguro).
 */
function syncL2ToL3(updated: BusinessProject): void {
  const existingIds = new Set(updated.layers.layer3.products.map((p) => p.productId));
  const newPricings: ProductPricing[] = updated.layers.layer2
    .filter((g) => !existingIds.has(g.productId))
    .map((g) => ({
      productId: g.productId,
      productName: g.productName,
      costBreakdown: { ingredients: 0, machines: 0, utensils: 0, services: 0, labor: 0, packaging: 0, totalCost: 0 },
      margenPorcentaje: 30,
      precioVenta: 0,
      ganancia: 0,
    }));
  if (newPricings.length > 0) {
    updated.layers.layer3.products.push(...newPricings);
  }
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
      // Detectar cambio en material de empaque (nodo resultado)
      if (node.type === 'resultado') {
        const resData = node.data as unknown as ResultadoNodeData;
        return resData.packagingMaterialId === insumoId;
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

  // Recalcular Layer 3 pricing (incluyendo desglose completo con servicios e impuestos)
  updated.layers.layer3 = {
    ...updated.layers.layer3,
    updatedAt: new Date().toISOString(),
    products: updated.layers.layer3.products.map((pricing) =>
      recalculateProductPricing(
        pricing,
        updated.layers.layer2,
        updated.layers.layer1,
        updated.layers.layer3.services,
        updated.layers.layer3.taxes,
        updated.layers.layer3.extraCosts
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
  const taxRate = Object.values(updated.layers.layer3.taxes)
    .filter((t): t is TaxConfig => !!t && t.enabled)
    .reduce((sum, t) => sum + t.rate, 0);

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
      applyExtraCostsToBreakdown(breakdown, graph.totalCost ?? 0, updated.layers.layer2, updated.layers.layer3.extraCosts);
      const { precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi } = calculatePricing(
        breakdown.totalCost,
        pricing.margenPorcentaje,
        taxRate
      );
      return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi };
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

  // Recalcular precioVenta, ganancia, precio con impuestos y ROI
  const pricing = updated.layers.layer3.products[pIdx];
  const taxRate = Object.values(updated.layers.layer3.taxes)
    .filter((t): t is TaxConfig => !!t && t.enabled)
    .reduce((sum, t) => sum + t.rate, 0);
  const { precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi } = calculatePricing(
    pricing.costBreakdown.totalCost,
    pricing.margenPorcentaje,
    taxRate
  );
  updated.layers.layer3.products[pIdx] = { ...pricing, precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi };
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
 * También sincroniza L2→L3: agrega ProductPricing para grafos sin precio asignado.
 */
export function recalculateAllLayers(project: BusinessProject): BusinessProject {
  const updated = structuredClone(project) as BusinessProject;

  // Sincronizar L2 → L3: crear entries de pricing para grafos nuevos
  syncL2ToL3(updated);

  // Recalcular todos los grafos de Layer 2
  updated.layers.layer2 = updated.layers.layer2.map((graph) =>
    recalculateProductGraph(
      graph,
      updated.layers.layer1,
      updated.layers.layer2,
      updated.layers.layer3.services
    )
  );

  // Calcular tasa total de impuestos para L3
  const taxRate = Object.values(updated.layers.layer3.taxes)
    .filter((t): t is TaxConfig => !!t && t.enabled)
    .reduce((sum, t) => sum + t.rate, 0);

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
      applyExtraCostsToBreakdown(breakdown, graph.totalCost ?? 0, updated.layers.layer2, updated.layers.layer3.extraCosts);
      const { precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi } = calculatePricing(
        breakdown.totalCost,
        pricing.margenPorcentaje,
        taxRate
      );
      return { ...pricing, costBreakdown: breakdown, precioVenta, ganancia, precioVentaConImpuestos, totalTaxRate, roi };
    }),
  };

  updated.updatedAt = new Date();
  return updated;
}
