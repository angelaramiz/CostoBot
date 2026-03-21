import type { Insumo } from './layer1-insumos';
import type { Proceso } from './layer2-procesos';
import type { Producto } from './layer3-productos';
import type { Precio } from './layer4-precios';

export interface ProjectLayers {
  layer1: Insumo[];
  layer2: Proceso[];
  layer3: Producto[];
  layer4: Precio[];
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
