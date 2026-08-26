/** Categorías de insumos en Layer 1 */
export type InsumoCategory = 'ingrediente' | 'maquina' | 'utensilio' | 'material';

export interface Insumo {
  id: string;
  name: string;
  unit: string;
  /** Costo por unidad en centavos (entero, sin decimales) */
  costPerUnit: number;
  category: InsumoCategory;
  isReusable: boolean;
  /** Solo para máquina/utensilio: costo de adquisición */
  acquisitionCost?: number;
  usefulLifeMonths?: number;
  residualValue?: number;
  /** Solo para material: proveedor */
  supplier?: string;
  /** Solo para material: código SKU */
  sku?: string;
  /** Solo cuando unit === 'paquete': cuánto contiene cada paquete */
  packageQuantity?: number;
  /** Solo cuando unit === 'paquete': en qué unidad está el contenido */
  packageUnit?: string;
}