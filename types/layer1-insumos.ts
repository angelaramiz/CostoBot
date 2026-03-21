export interface Insumo {
  id: string;
  name: string;
  unit: string;
  /** Costo por unidad en centavos (entero, sin decimales) */
  costPerUnit: number;
  /** Cantidad usada en el proceso */
  quantity: number;
}
