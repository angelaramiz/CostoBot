/**
 * calculations.ts — CostoBot
 *
 * Funciones de cálculo para la arquitectura de 3 capas.
 * - Depreciación de utensilios/máquinas
 * - Costo de máquinas (tiempo + temperatura)
 * - Rendimiento (yield)
 * - Herencia proporcional de productos reutilizables
 */

/**
 * Calcula el costo de depreciación de un utensilio por unidad producida.
 * Fórmula: (acquisitionCost - residualValue) / usefulLifeMonths / unitsProducedThisMonth
 *
 * @returns Costo por unidad en centavos (redondeado)
 */
export function calculateUtensilDepreciation(
  acquisitionCost: number,
  residualValue: number,
  usefulLifeMonths: number,
  unitsProducedThisMonth: number
): number {
  if (usefulLifeMonths <= 0 || unitsProducedThisMonth <= 0) return 0;
  const monthlyDepreciation = (acquisitionCost - residualValue) / usefulLifeMonths;
  return Math.round(monthlyDepreciation / unitsProducedThisMonth);
}

/**
 * Calcula el costo de una máquina según tiempo de uso y factor de temperatura.
 * Fórmula: (costPerHour / 60) * timeMinutes * temperatureFactor / expectedOutput
 *
 * @param machineCostPerHour Costo por hora de la máquina en centavos
 * @param timeMinutes Tiempo de uso en minutos
 * @param temperatureFactor Factor multiplicador por temperatura (default 1.0)
 * @param expectedOutput Cantidad esperada de output
 * @returns Costo por unidad en centavos (redondeado)
 */
export function calculateMachineCost(
  machineCostPerHour: number,
  timeMinutes: number,
  temperatureFactor: number = 1.0,
  expectedOutput: number = 1
): number {
  if (expectedOutput <= 0) return 0;
  const timeCost = (machineCostPerHour / 60) * timeMinutes * temperatureFactor;
  return Math.round(timeCost / expectedOutput);
}

/**
 * Calcula el rendimiento (yield) de un proceso.
 * Fórmula: expectedOutput / inputTotal
 *
 * @returns Valor entre 0 y 1 (ej: 0.80 = 80% rendimiento)
 */
export function calculateYield(
  inputTotal: number,
  expectedOutput: number
): number {
  if (inputTotal <= 0) return 0;
  return expectedOutput / inputTotal;
}

/**
 * Calcula el costo heredado de un producto reutilizable (importado).
 * Fórmula: parentProductCost * (quantityUsed / parentProductQuantity)
 *
 * @param parentProductCost Costo total del producto padre en centavos
 * @param parentProductQuantity Cantidad total del producto padre
 * @param quantityUsed Cantidad del producto padre que se está usando
 * @returns Costo heredado en centavos (redondeado)
 */
export function calculateInheritedCost(
  parentProductCost: number,
  parentProductQuantity: number,
  quantityUsed: number
): number {
  if (parentProductQuantity <= 0) return 0;
  const percentage = quantityUsed / parentProductQuantity;
  return Math.round(parentProductCost * percentage);
}

/**
 * Calcula el costo de un material (insumo tipo 'material').
 * Fórmula: costPerUnit × quantity
 *
 * @param costPerUnit Costo por unidad en centavos
 * @param quantity Cantidad usada
 * @returns Costo total en centavos (redondeado)
 */
export function calculateMaterialCost(
  costPerUnit: number,
  quantity: number
): number {
  if (quantity <= 0) return 0;
  return Math.round(costPerUnit * quantity);
}

/**
 * Calcula el precio de venta y ganancia a partir del costo unitario y margen.
 * precioVenta = costoUnitario * (1 + margenPorcentaje / 100)
 * ganancia = precioVenta - costoUnitario (en centavos)
 */
export function calculatePricing(
  costoUnitario: number,
  margenPorcentaje: number
): { precioVenta: number; ganancia: number } {
  const precioVenta = Math.round(costoUnitario * (1 + margenPorcentaje / 100));
  const ganancia = precioVenta - costoUnitario;
  return { precioVenta, ganancia };
}
