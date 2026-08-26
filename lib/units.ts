/**
 * units.ts — Sistema de unidades coherente para CostoBot
 * - Ingrediente: peso / volumen / cantidad con conversión precisa
 * - Material / Utensilio / Máquina: sin kg/L, solo unidades coherentes
 * Todas las conversiones usan enteros (unidad base) para evitar floats raros.
 */

// Grupos físicos — cada grupo comparte base y factores enteros
const UNIT_GROUPS = {
  weight: {
    label: 'Peso',
    base: 'g' as const,
    // factor a mg (unidad mínima) para precisión entera
    units: {
      mg: { factor: 1, label: 'miligramo' },
      g: { factor: 1000, label: 'gramo' },
      kg: { factor: 1_000_000, label: 'kilogramo' },
    },
  },
  volume: {
    label: 'Volumen',
    base: 'ml' as const,
    units: {
      ml: { factor: 1, label: 'mililitro' },
      L: { factor: 1000, label: 'litro' },
    },
  },
  count: {
    label: 'Cantidad',
    base: 'pza' as const,
    units: {
      pza: { factor: 1, label: 'pieza' },
    },
  },
  length: {
    label: 'Longitud',
    base: 'mm' as const,
    units: {
      mm: { factor: 1, label: 'milímetro' },
      cm: { factor: 10, label: 'centímetro' },
      m: { factor: 1000, label: 'metro' },
    },
  },
  time: {
    label: 'Tiempo',
    base: 'min' as const,
    units: {
      min: { factor: 1, label: 'minuto' },
      hr: { factor: 60, label: 'hora' },
    },
  },
} as const;

type UnitGroupKey = keyof typeof UNIT_GROUPS;
type Unit = string; // 'kg' | 'g' | 'mg' | 'L' | 'ml' | 'pza' | 'm' | 'cm' | 'mm' | 'hr' | 'min'

const UNIT_TO_GROUP = new Map<string, UnitGroupKey>();
const UNIT_FACTOR = new Map<string, number>();

for (const [groupKey, group] of Object.entries(UNIT_GROUPS) as [UnitGroupKey, typeof UNIT_GROUPS[UnitGroupKey]][]) {
  for (const [unit, meta] of Object.entries(group.units)) {
    UNIT_TO_GROUP.set(unit, groupKey);
    UNIT_FACTOR.set(unit, (meta as { factor: number }).factor);
  }
}

// Unidades permitidas por categoría de insumo
export const UNITS_BY_CATEGORY: Record<string, string[]> = {
  ingrediente: ['mg', 'g', 'kg', 'ml', 'L', 'pza'],
  material: ['pza', 'm', 'cm', 'mm'],
  utensilio: ['pza'],
  maquina: ['pza', 'hr'],
};

export const UNIT_GROUP_LABELS: Record<UnitGroupKey, string> = {
  weight: 'Peso',
  volume: 'Volumen',
  count: 'Cantidad',
  length: 'Longitud',
  time: 'Tiempo',
};

export function getUnitGroup(unit: string): UnitGroupKey | null {
  return UNIT_TO_GROUP.get(unit) ?? null;
}

export function areUnitsCompatible(a: string, b: string): boolean {
  const ga = getUnitGroup(a);
  const gb = getUnitGroup(b);
  return ga !== null && ga === gb;
}

/**
 * Convierte quantity de fromUnit a toUnit dentro del mismo grupo.
 * Retorna null si son incompatibles (ej: kg -> L).
 * Usa aritmética entera para precisión: quantity * factorFrom / factorTo
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit === toUnit) return quantity;
  const fa = UNIT_FACTOR.get(fromUnit);
  const fb = UNIT_FACTOR.get(toUnit);
  if (fa == null || fb == null) return null;
  if (getUnitGroup(fromUnit) !== getUnitGroup(toUnit)) return null;
  return (quantity * fa) / fb;
}

/**
 * Costo preciso de un ingrediente considerando conversión de unidades.
 * costPerUnit está en centavos por costUnit. quantity está en quantityUnit.
 * Si las unidades son incompatibles, asume 1:1 (fallback defensivo).
 */
export function calculateIngredientCost(
  costPerUnit: number,
  costUnit: string,
  quantity: number,
  quantityUnit: string
): number {
  if (quantity <= 0 || costPerUnit <= 0) return 0;
  if (costUnit === quantityUnit) return Math.round(costPerUnit * quantity);
  const converted = convertQuantity(quantity, quantityUnit, costUnit);
  if (converted == null) {
    // Unidades incompatibles (ej: kg vs pza) — fallback 1:1 para no romper cálculo
    return Math.round(costPerUnit * quantity);
  }
  // costPerUnit * quantityEnCostUnit, redondeo al centavo más cercano
  return Math.round(costPerUnit * converted);
}

export function getUnitsForCategory(category: string): string[] {
  return UNITS_BY_CATEGORY[category] ?? ['pza'];
}

export function getGroupedUnitsForCategory(category: string): { group: UnitGroupKey; units: string[] }[] {
  const units = getUnitsForCategory(category);
  const grouped = new Map<UnitGroupKey, string[]>();
  for (const u of units) {
    const g = getUnitGroup(u);
    if (!g) continue;
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(u);
  }
  return Array.from(grouped.entries()).map(([group, us]) => ({ group, units: us }));
}
