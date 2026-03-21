export interface Producto {
  id: string;
  name: string;
  /** IDs de los procesos (Layer 2) que conforman este producto */
  procesoIds: string[];
  /** Costo unitario en centavos — calculado por cascade engine */
  costoUnitario: number;
}
