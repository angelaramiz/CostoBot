import { z } from 'zod';

/**
 * Schemas para Layer 2 — Productos (nodos + grafos)
 * @see types/layer2-productos.ts
 */

/** Tipos de nodos válidos en un grafo de producto */
export const NodeTypeSchema = z.enum([
  'ingredient',
  'utensil',
  'machine',
  'resultado',
  'export',
  'import',
]);

const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// ── Data schemas por tipo de nodo ───────────────────────────────────────────

const IngredientNodeDataSchema = z.object({
  insumoId: z.string().min(1),
  insumoName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

const UtensilNodeDataSchema = z.object({
  insumoId: z.string().min(1),
  insumoName: z.string().min(1),
  unitsProducedThisMonth: z.number().positive(),
});

const MachineNodeDataSchema = z.object({
  insumoId: z.string().min(1),
  insumoName: z.string().min(1),
  timeMinutes: z.number().positive(),
  temperature: z.number().optional(),
  temperatureUnit: z.enum(['C', 'F']).optional(),
  serviceType: z.enum(['electricity', 'gas', 'both']).optional(),
  powerKw: z.number().nonnegative().optional(),
  gasM3PerHour: z.number().nonnegative().optional(),
});

const MainProductOutputSchema = z.object({
  name: z.string().min(1),
  expectedQuantity: z.number().positive(),
  unit: z.string().min(1),
});

const ByProductOutputSchema = z.object({
  name: z.string().min(1),
  expectedQuantity: z.number().nonnegative(),
  unit: z.string().min(1),
  canBeIngredient: z.boolean(),
  globalIngredientId: z.string().optional(),
});

const ResultadoNodeDataSchema = z.object({
  mainProduct: MainProductOutputSchema,
  byProduct: ByProductOutputSchema.optional(),
  inputTotal: z.number().positive(),
  yield: z.number().min(0).max(1),
});

const ExportNodeDataSchema = z.object({
  exportedProductId: z.string().min(1),
  exportedProductName: z.string().min(1),
  isReusable: z.boolean(),
});

const ImportNodeDataSchema = z.object({
  sourceProductId: z.string().min(1),
  sourceProductName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

/** Unión discriminada de todos los tipos de data de nodo */
const NodeDataSchema = z.union([
  IngredientNodeDataSchema,
  UtensilNodeDataSchema,
  MachineNodeDataSchema,
  ResultadoNodeDataSchema,
  ExportNodeDataSchema,
  ImportNodeDataSchema,
]);

// ── Nodo del grafo ──────────────────────────────────────────────────────────

export const ProductNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  position: NodePositionSchema,
  data: NodeDataSchema,
});

// ── Arista del grafo ────────────────────────────────────────────────────────

const EdgeDataSchema = z.object({
  quantityUsed: z.number().optional(),
  unit: z.string().optional(),
  timeUsed: z.number().optional(),
});

export const ProductEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  data: EdgeDataSchema.optional(),
});

// ── Grafo de producto ───────────────────────────────────────────────────────

export const ProductGraphSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es requerido'),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  version: z.string().min(1),
  nodes: z.array(ProductNodeSchema),
  edges: z.array(ProductEdgeSchema),
  totalCost: z.number().int().nonnegative(),
  laborCost: z.number().int().nonnegative(),
  /** Consumo de servicios por unidad (ej: { electricity: 2.5 } → 2.5 kWh/unidad) */
  servicesUsage: z.record(z.string(), z.number().nonnegative()).optional(),
});

export type ProductGraphInput = z.infer<typeof ProductGraphSchema>;

/**
 * @deprecated Schema legacy — mantener temporalmente para compatibilidad.
 */
export const ProcesoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  insumoIds: z.array(z.string().min(1, 'El ID de insumo no puede estar vacío')),
  laborCost: z
    .number()
    .int('El costo de mano de obra debe ser un entero en centavos')
    .nonnegative('El costo de mano de obra no puede ser negativo'),
  totalCost: z
    .number()
    .int('El costo total debe ser un entero en centavos')
    .nonnegative('El costo total no puede ser negativo'),
});

export type ProcesoInput = z.infer<typeof ProcesoSchema>;
