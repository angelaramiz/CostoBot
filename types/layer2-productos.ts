/**
 * Layer 2 — Productos (Nodos + Grafos)
 *
 * Cada producto es un grafo independiente de nodos y aristas.
 * Reemplaza el viejo concepto de "Procesos" + "Productos" en un solo editor visual.
 */

// ── Tipos de nodos ──────────────────────────────────────────────────────────

export type NodeType =
  | 'ingredient'   // Referencia a un insumo de Layer 1
  | 'utensil'      // Utensilio con depreciación
  | 'machine'      // Máquina con tiempo/temperatura
  | 'resultado'    // Mezcla/proceso con outputs (main + byproduct)
  | 'export'       // Marca el producto como reutilizable
  | 'import';      // Importa un producto de otro grafo

export interface NodePosition {
  x: number;
  y: number;
}

// ── Data específica por tipo de nodo ────────────────────────────────────────

export interface IngredientNodeData {
  insumoId: string;
  insumoName: string;
  quantity: number;
  unit: string;
}

export interface UtensilNodeData {
  insumoId: string;
  insumoName: string;
  /** Unidades producidas este mes (para cálculo de depreciación) */
  unitsProducedThisMonth: number;
}

export interface MachineNodeData {
  insumoId: string;
  insumoName: string;
  /** Tiempo de uso en minutos */
  timeMinutes: number;
  temperature?: number;
  temperatureUnit?: 'C' | 'F';
}

export interface MainProductOutput {
  name: string;
  expectedQuantity: number;
  unit: string;
}

export interface ByProductOutput {
  name: string;
  expectedQuantity: number;
  unit: string;
  /** Si el subproducto puede registrarse como insumo global en Layer 1 */
  canBeIngredient: boolean;
  /** ID del insumo Layer 1 si fue registrado como ingrediente */
  globalIngredientId?: string;
}

export interface ResultadoNodeData {
  mainProduct: MainProductOutput;
  byProduct?: ByProductOutput;
  /** Cantidad total de entrada (suma de ingredientes) */
  inputTotal: number;
  /** Rendimiento: expectedOutput / inputTotal (ej: 0.80 = 80%) */
  yield: number;
}

export interface ExportNodeData {
  exportedProductId: string;
  exportedProductName: string;
  isReusable: boolean;
}

export interface ImportNodeData {
  /** ID del producto importado (de otro grafo) */
  sourceProductId: string;
  sourceProductName: string;
  /** Cantidad usada del producto importado */
  quantity: number;
  unit: string;
}

// ── Nodo genérico del grafo ─────────────────────────────────────────────────

export interface ProductNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: IngredientNodeData | UtensilNodeData | MachineNodeData
    | ResultadoNodeData | ExportNodeData | ImportNodeData;
}

// ── Aristas del grafo ───────────────────────────────────────────────────────

export interface EdgeData {
  quantityUsed?: number;
  unit?: string;
  timeUsed?: number;
}

export interface ProductEdge {
  id: string;
  source: string;
  target: string;
  data?: EdgeData;
}

// ── Grafo completo de un producto ───────────────────────────────────────────

export interface ProductGraph {
  productId: string;
  productName: string;
  version: string;
  nodes: ProductNode[];
  edges: ProductEdge[];
  /** Costo total calculado del producto en centavos */
  totalCost: number;
  /** Costo de mano de obra en centavos (entero) */
  laborCost: number;
  /**
   * Consumo de servicios por unidad producida.
   * Claves: nombre del servicio (mismo que en Layer3.services), valor: unidades consumidas.
   * Ejemplo: { "electricity": 2.5 } → 2.5 kWh por unidad
   */
  servicesUsage?: Record<string, number>;
}

/**
 * @deprecated Alias temporal para compatibilidad con código legacy.
 * Será eliminado cuando se complete la migración del store.
 */
export interface Proceso {
  id: string;
  name: string;
  insumoIds: string[];
  laborCost: number;
  totalCost: number;
}
