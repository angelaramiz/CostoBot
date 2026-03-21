/** Cómo se calcula el costo de este producto */
export type ProductType = 'fabricado' | 'retail' | 'servicio';

export interface Producto {
  id: string;
  name: string;
  /**
   * Tipo de producto:
   * - `fabricado`: costo calculado desde insumos/procesos (default)
   * - `retail`:    producto de reventa — costo fijado manualmente via `costoCompra`
   * - `servicio`:  basado en tiempo/expertise — costo fijado manualmente via `costoCompra`
   */
  productType?: ProductType;
  /** IDs de los procesos (Layer 2) que conforman este producto (solo para `fabricado`) */
  procesoIds: string[];
  /** Costo de compra/base en centavos — usado cuando `productType` es 'retail' o 'servicio' */
  costoCompra?: number;
  /** Costo unitario en centavos — calculado por cascade engine */
  costoUnitario: number;
}
