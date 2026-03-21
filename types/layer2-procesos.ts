export interface Proceso {
  id: string;
  name: string;
  /** IDs de los insumos (Layer 1) que usa este proceso */
  insumoIds: string[];
  /** Costo de mano de obra en centavos (entero) */
  laborCost: number;
  /** Costo total en centavos — calculado por cascade engine */
  totalCost: number;
}
