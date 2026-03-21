export interface Precio {
  id: string;
  /** ID del producto (Layer 3) al que pertenece este precio */
  productoId: string;
  /** Margen de ganancia en porcentaje (ej: 30 = 30%) */
  margenPorcentaje: number;
  /** Precio de venta en centavos — calculado por cascade engine */
  precioVenta: number;
  /** Retorno sobre inversión en porcentaje — calculado por cascade engine */
  roi: number;
}
