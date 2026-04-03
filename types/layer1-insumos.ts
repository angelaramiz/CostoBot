/** Categorías de insumos en Layer 1 */
export type InsumoCategory = 'ingrediente' | 'maquina' | 'utensilio' | 'material';

export interface Insumo {
  id: string;
  name: string;
  unit: string;
  /** Costo por unidad en centavos (entero, sin decimales) */
  costPerUnit: number;
  /** Cantidad usada en el proceso */
  quantity: number;
  category: InsumoCategory;
  isReusable: boolean;
  acquisitionCost?: number;
  usefulLifeMonths?: number;
  residualValue?: number;
  supplier?: string;
  sku?: string;
}