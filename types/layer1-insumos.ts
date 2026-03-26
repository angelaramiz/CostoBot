/** Categorías de insumos en Layer 1 */
export type InsumoCategory = 'ingrediente' | 'maquina' | 'utensilio';

export interface Insumo {
  id: string;
  name: string;
  unit: string;
  /** Costo por unidad en centavos (entero, sin decimales) */
  costPerUnit: number;
  /** Cantidad usada en el proceso */
  quantity: number;
  /** Categoría del insumo: ingrediente, maquina o utensilio */
  category: InsumoCategory;
  /** Si el insumo es reutilizable (máquinas, utensilios) */
  isReusable: boolean;

  // ── Campos de depreciación (solo para maquina/utensilio) ────────────────
  /** Costo de adquisición del equipo en centavos */
  acquisitionCost?: number;
  /** Vida útil estimada en meses */
  usefulLifeMonths?: number;
  /** Valor residual al fin de vida útil en centavos */
  residualValue?: number;
}
