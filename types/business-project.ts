import type { Insumo } from './layer1-insumos';
import type { ProductGraph } from './layer2-productos';
import type { Layer3Precios } from './layer3-precios';

// Legacy imports para compatibilidad temporal
import type { Proceso } from './layer2-productos';
import type { Producto, ProductType } from './layer3-precios';

/**
 * Nueva estructura de 3 capas:
 * - layer1: Catálogo de insumos (ingredientes, máquinas, utensilios)
 * - layer2: Grafos de productos (editor visual de nodos)
 * - layer3: Precios, servicios e impuestos
 */
export interface ProjectLayers {
  layer1: Insumo[];
  layer2: ProductGraph[];
  layer3: Layer3Precios;
}

/**
 * @deprecated Estructura legacy de 4 capas. Usar ProjectLayers.
 * Se mantiene para migración gradual del store y cascade engine.
 */
export interface LegacyProjectLayers {
  layer1: Insumo[];
  layer2: Proceso[];
  layer3: Producto[];
  layer4: Producto; // Alias legacy para "Precio" (ahora es ProductPricing en Layer3)
}

export interface BusinessProject {
  id: string;
  name: string;
  /** Firebase UID del propietario */
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  layers: ProjectLayers;
}
