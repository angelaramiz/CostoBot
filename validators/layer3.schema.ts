import { z } from 'zod';

/**
 * Schemas para Layer 3 — Precios (servicios, impuestos, productos)
 * @see types/layer3-precios.ts
 */

// ── Servicios ───────────────────────────────────────────────────────────────

export const ServiceRateSchema = z.object({
  baseRate: z.number().nonnegative(),
  unit: z.string().min(1),
  currency: z.string().min(1),
});

export const ServicesConfigSchema = z.record(z.string(), ServiceRateSchema).default({});

// ── Impuestos ───────────────────────────────────────────────────────────────

export const TaxConfigSchema = z.object({
  rate: z.number().min(0).max(1),
  enabled: z.boolean(),
  country: z.string().min(1),
});

export const TaxesConfigSchema = z.record(z.string(), TaxConfigSchema).default({});

// ── Desglose de costos ──────────────────────────────────────────────────────

export const CostBreakdownSchema = z.object({
  ingredients: z.number().int().nonnegative(),
  machines: z.number().int().nonnegative(),
  utensils: z.number().int().nonnegative(),
  services: z.number().int().nonnegative(),
  labor: z.number().int().nonnegative(),
  packaging: z.number().int().nonnegative().optional().default(0),
  fixed: z.number().int().nonnegative().optional().default(0),
  totalCost: z.number().int().nonnegative(),
});

// ── Gastos fijos y agregados ──────────────────────────────────────────────

export const FixedCostsSchema = z.object({
  renta: z.number().int().nonnegative().optional(),
  serviciosFijos: z.number().int().nonnegative().optional(),
  sueldosFijos: z.number().int().nonnegative().optional(),
  otrosFijos: z.number().int().nonnegative().optional(),
  unidadesMes: z.number().int().nonnegative().optional(),
}).optional();

export const ExtraCostsSchema = z.object({
  laborCost: z.number().int().nonnegative().optional(),
  packagingShipping: z.number().int().nonnegative().optional(),
  other: z.number().int().nonnegative().optional(),
}).optional();

// ── Pricing por producto ────────────────────────────────────────────────────

export const ProductPricingSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es requerido'),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  costBreakdown: CostBreakdownSchema,
  margenPorcentaje: z
    .number()
    .nonnegative('El margen de ganancia no puede ser negativo'),
  precioVenta: z
    .number()
    .int('El precio de venta debe ser un entero en centavos')
    .nonnegative('El precio de venta no puede ser negativo'),
  ganancia: z.number({ required_error: 'La ganancia es requerida' }),
  totalTaxRate: z.number().min(0).optional(),
  precioVentaConImpuestos: z.number().int().nonnegative().optional(),
  roi: z.number().optional(),
  unidadesLote: z.number().int().nonnegative().optional(),
  unidadProducto: z.string().optional(),
  costoUnitario: z.number().int().nonnegative().optional(),
  precioUnitario: z.number().int().nonnegative().optional(),
  precioUnitarioConImpuestos: z.number().int().nonnegative().optional(),
  gananciaUnitaria: z.number().optional(),
  impuestoMonto: z.number().int().nonnegative().optional(),
});

// ── Layer 3 completa ────────────────────────────────────────────────────────

export const Layer3PreciosSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string(),
  services: ServicesConfigSchema,
  taxes: TaxesConfigSchema,
  fixedCosts: FixedCostsSchema,
  extraCosts: ExtraCostsSchema,
  products: z.array(ProductPricingSchema),
});

export type Layer3PreciosInput = z.infer<typeof Layer3PreciosSchema>;
export type ProductPricingInput = z.infer<typeof ProductPricingSchema>;

/**
 * @deprecated Schema legacy — mantener temporalmente para compatibilidad.
 */
export const ProductoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  procesoIds: z.array(z.string().min(1, 'El ID de proceso no puede estar vacío')),
  costoUnitario: z
    .number()
    .int('El costo unitario debe ser un entero en centavos')
    .nonnegative('El costo unitario no puede ser negativo'),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;
