/**
 * Layer 3 — Precios, Servicios e Impuestos
 *
 * Absorbe el viejo Layer 4 (Precios) y agrega:
 * - Servicios (electricidad, agua, gas)
 * - Impuestos (IVA, configurables por país)
 * - Desglose de costos por producto
 * - Márgenes y precios de venta
 */

// ── Servicios ───────────────────────────────────────────────────────────────

export interface ServiceRate {
  baseRate: number;
  unit: string;
  currency: string;
}

export interface ServicesConfig {
  electricity?: ServiceRate;
  water?: ServiceRate;
  gas?: ServiceRate;
  [key: string]: ServiceRate | undefined;
}

// ── Impuestos ───────────────────────────────────────────────────────────────

export interface TaxConfig {
  rate: number;
  enabled: boolean;
  country: string;
}

export interface TaxesConfig {
  iva?: TaxConfig;
  [key: string]: TaxConfig | undefined;
}

// ── Desglose de costos por producto ─────────────────────────────────────────

export interface CostBreakdown {
  ingredients: number;
  machines: number;
  utensils: number;
  services: number;
  labor: number;
  /** Costo de materiales de empaque por lote en centavos */
  packaging?: number;
  /** Parte proporcional de gastos fijos mensuales */
  fixed?: number;
  totalCost: number;
}

export interface ProductPricing {
  productId: string;
  productName: string;
  costBreakdown: CostBreakdown;
  /** Margen de ganancia en porcentaje (ej: 30 = 30%) */
  margenPorcentaje: number;
  /** Precio de venta por LOTE en centavos — calculado */
  precioVenta: number;
  /** Ganancia por LOTE (precioVenta - costoTotal) */
  ganancia: number;
  /** Tasa total de impuestos aplicada (suma de impuestos habilitados, ej: 0.16 = 16%) */
  totalTaxRate?: number;
  /** Precio de venta con impuestos por LOTE en centavos — calculado */
  precioVentaConImpuestos?: number;
  /** Margen bruto (gross margin): ganancia / precioVentaFinal * 100 */
  roi?: number;
  /** Unidades en el lote (para coherencia por unidad) */
  unidadesLote?: number;
  /** Unidad del producto (ej: pza, kg, L) */
  unidadProducto?: string;
  /** Costo por UNIDAD en centavos */
  costoUnitario?: number;
  /** Precio por UNIDAD sin impuestos */
  precioUnitario?: number;
  /** Precio por UNIDAD con impuestos */
  precioUnitarioConImpuestos?: number;
  /** Ganancia por UNIDAD */
  gananciaUnitaria?: number;
  /** Monto de impuestos por lote */
  impuestoMonto?: number;
}

// ── Gastos Fijos (mensuales) ────────────────────────────────────────────────

export interface FixedCosts {
  /** Renta/alquiler mensual en centavos */
  renta?: number;
  /** Servicios fijos (luz base, agua, internet) en centavos/mes */
  serviciosFijos?: number;
  /** Sueldos fijos mensuales en centavos */
  sueldosFijos?: number;
  /** Otros gastos fijos en centavos/mes */
  otrosFijos?: number;
  /** Unidades totales producidas al mes (para prorrateo por unidad) */
  unidadesMes?: number;
}

// ── Gastos Agregados (por lote) ───────────────────────────────────────────

export interface ExtraCosts {
  /** Costo de mano de obra por lote en centavos */
  laborCost?: number;
  /** Costo de empaque/envío extra en centavos */
  packagingShipping?: number;
  /** Otros gastos adicionales en centavos */
  other?: number;
}

// ── Layer 3 completa ────────────────────────────────────────────────────────

export interface Layer3Precios {
  version: string;
  updatedAt: string;
  services: ServicesConfig;
  taxes: TaxesConfig;
  fixedCosts?: FixedCosts;
  extraCosts?: ExtraCosts;
  products: ProductPricing[];
}

/**
 * @deprecated Alias temporal para compatibilidad con código legacy.
 * Usar ProductPricing en su lugar.
 */
export type ProductType = 'fabricado' | 'retail' | 'servicio';

/**
 * @deprecated Alias temporal para compatibilidad con código legacy.
 * Será eliminado cuando se complete la migración del store.
 */
export interface Producto {
  id: string;
  name: string;
  productType?: ProductType;
  procesoIds: string[];
  costoCompra?: number;
  costoUnitario: number;
}
