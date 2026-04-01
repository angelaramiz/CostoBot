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
  totalCost: number;
}

export interface ProductPricing {
  productId: string;
  productName: string;
  costBreakdown: CostBreakdown;
  /** Margen de ganancia en porcentaje (ej: 30 = 30%) */
  margenPorcentaje: number;
  /** Precio de venta en centavos — calculado */
  precioVenta: number;
  /** Ganancia en dinero (centavos) — diferencia entre precioVenta y costoTotal */
  ganancia: number;
}

// ── Layer 3 completa ────────────────────────────────────────────────────────

export interface Layer3Precios {
  version: string;
  updatedAt: string;
  services: ServicesConfig;
  taxes: TaxesConfig;
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
