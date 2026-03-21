import type { BusinessProject } from '@/types/business-project';
import type { Insumo } from '@/types/layer1-insumos';
import type { Proceso } from '@/types/layer2-procesos';
import type { Producto } from '@/types/layer3-productos';
import type { Precio } from '@/types/layer4-precios';

type LayerId = 'layer1' | 'layer2' | 'layer3' | 'layer4';

/**
 * Recalcula el totalCost de un proceso en base a los insumos activos del proyecto.
 * totalCost = Σ(insumo.costPerUnit * insumo.quantity) + proceso.laborCost
 */
function recalculateProceso(proceso: Proceso, insumos: Insumo[]): Proceso {
  const insumoMap = new Map(insumos.map((i) => [i.id, i]));
  const costoInsumos = proceso.insumoIds.reduce((acc, id) => {
    const insumo = insumoMap.get(id);
    if (!insumo) return acc;
    return acc + Math.round(insumo.costPerUnit * insumo.quantity);
  }, 0);
  return { ...proceso, totalCost: costoInsumos + proceso.laborCost };
}

/**
 * Recalcula el costoUnitario de un producto en base a los procesos activos del proyecto.
 * costoUnitario = Σ proceso.totalCost
 */
function recalculateProducto(producto: Producto, procesos: Proceso[]): Producto {
  const procesoMap = new Map(procesos.map((p) => [p.id, p]));
  const costoUnitario = producto.procesoIds.reduce((acc, id) => {
    const proceso = procesoMap.get(id);
    if (!proceso) return acc;
    return acc + proceso.totalCost;
  }, 0);
  return { ...producto, costoUnitario };
}

/**
 * Recalcula el precioVenta y el ROI de un precio en base al producto referenciado.
 * precioVenta = costoUnitario * (1 + margenPorcentaje / 100)
 * roi = (precioVenta - costoUnitario) / costoUnitario * 100
 */
function recalculatePrecio(precio: Precio, productos: Producto[]): Precio {
  const producto = productos.find((p) => p.id === precio.productoId);
  if (!producto) return precio;

  const { costoUnitario } = producto;
  const precioVenta = Math.round(costoUnitario * (1 + precio.margenPorcentaje / 100));
  const roi =
    costoUnitario > 0
      ? ((precioVenta - costoUnitario) / costoUnitario) * 100
      : 0;

  return { ...precio, precioVenta, roi };
}

/**
 * Aplica un cambio de valor a un ítem específico del proyecto y propaga
 * los recálculos en cascada por todas las capas dependientes.
 *
 * @returns Un nuevo BusinessProject con todos los valores actualizados (inmutable).
 */
export function propagateChange(
  project: BusinessProject,
  layerId: LayerId,
  itemId: string,
  field: string,
  newValue: number | string
): BusinessProject {
  const updatedProject: BusinessProject = structuredClone(project);

  // Aplicar el cambio directo en la capa indicada
  // La doble aserción es intencional: necesitamos acceso genérico por campo dinámico
  const layerItems = updatedProject.layers[layerId] as unknown as Array<Record<string, unknown>>;
  const itemIndex = layerItems.findIndex((item) => item['id'] === itemId);
  if (itemIndex === -1) return project;
  layerItems[itemIndex] = { ...layerItems[itemIndex], [field]: newValue };

  // Determinar qué ítems aguas abajo necesitan recalcularse
  const affectedL2Ids = new Set<string>();
  const affectedL3Ids = new Set<string>();
  const affectedL4Ids = new Set<string>();

  // Layer1 → detectar procesos afectados
  if (layerId === 'layer1') {
    for (const proceso of updatedProject.layers.layer2) {
      if (proceso.insumoIds.includes(itemId)) {
        affectedL2Ids.add(proceso.id);
      }
    }
  }

  // Layer2 (cambio directo o cascada desde L1) → detectar productos afectados
  const changedProcesos =
    layerId === 'layer2'
      ? new Set([itemId, ...affectedL2Ids])
      : affectedL2Ids;

  if (changedProcesos.size > 0) {
    for (const producto of updatedProject.layers.layer3) {
      if (producto.procesoIds.some((id) => changedProcesos.has(id))) {
        affectedL3Ids.add(producto.id);
      }
    }
  }

  // Layer3 (cambio directo o cascada desde L2) → detectar precios afectados
  const changedProductos =
    layerId === 'layer3'
      ? new Set([itemId, ...affectedL3Ids])
      : affectedL3Ids;

  if (changedProductos.size > 0) {
    for (const precio of updatedProject.layers.layer4) {
      if (changedProductos.has(precio.productoId)) {
        affectedL4Ids.add(precio.id);
      }
    }
  }

  // Layer4: cambio directo (ej: cambio de margen)
  if (layerId === 'layer4') {
    affectedL4Ids.add(itemId);
  }

  // Recalcular Layer 2
  if (affectedL2Ids.size > 0) {
    updatedProject.layers.layer2 = updatedProject.layers.layer2.map((proceso) =>
      affectedL2Ids.has(proceso.id)
        ? recalculateProceso(proceso, updatedProject.layers.layer1)
        : proceso
    );
  }

  // Recalcular Layer 3
  if (affectedL3Ids.size > 0) {
    updatedProject.layers.layer3 = updatedProject.layers.layer3.map((producto) =>
      affectedL3Ids.has(producto.id)
        ? recalculateProducto(producto, updatedProject.layers.layer2)
        : producto
    );
  }

  // Recalcular Layer 4
  if (affectedL4Ids.size > 0) {
    updatedProject.layers.layer4 = updatedProject.layers.layer4.map((precio) =>
      affectedL4Ids.has(precio.id)
        ? recalculatePrecio(precio, updatedProject.layers.layer3)
        : precio
    );
  }

  updatedProject.updatedAt = new Date();
  return updatedProject;
}

/**
 * Recalcula todas las capas del proyecto desde cero.
 * Usar tras cambios estructurales (agregar / eliminar ítems).
 */
export function recalculateAllLayers(project: BusinessProject): BusinessProject {
  const updated = structuredClone(project) as BusinessProject;

  // Recalcular Layer2 totalCost
  updated.layers.layer2 = updated.layers.layer2.map((proceso) =>
    recalculateProceso(proceso, updated.layers.layer1)
  );

  // Recalcular Layer3 costoUnitario
  updated.layers.layer3 = updated.layers.layer3.map((producto) =>
    recalculateProducto(producto, updated.layers.layer2)
  );

  // Recalcular Layer4 precioVenta + roi
  updated.layers.layer4 = updated.layers.layer4.map((precio) =>
    recalculatePrecio(precio, updated.layers.layer3)
  );

  updated.updatedAt = new Date();
  return updated;
}
