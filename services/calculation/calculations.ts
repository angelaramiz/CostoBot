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

/**
 * Calcula el costo de operación de una máquina según el tipo de servicio consumido.
 * - electricity: kW × (minutos/60) × tarifa_electricidad (centavos/kWh)
 * - gas: m³/hora × (minutos/60) × tarifa_gas (centavos/m³)
 * - both: suma de electricidad + gas
 *
 * @param serviceType Tipo de servicio: 'electricity', 'gas' o 'both'
 * @param timeMinutes Tiempo de uso en minutos
 * @param powerKw Potencia en kW (para máquinas eléctricas)
 * @param gasM3PerHour Consumo de gas en m³/hora (para máquinas a gas)
 * @param electricityRate Tarifa de electricidad en centavos/kWh
 * @param gasRate Tarifa de gas en centavos/m³
 * @returns Costo del servicio en centavos (redondeado)
 */
export function calculateMachineServiceCost(
  serviceType: 'electricity' | 'gas' | 'both',
  timeMinutes: number,
  powerKw: number = 0,
  gasM3PerHour: number = 0,
  electricityRate: number = 0,
  gasRate: number = 0
): number {
  const hours = timeMinutes / 60;
  let cost = 0;
  if (serviceType === 'electricity' || serviceType === 'both') {
    cost += powerKw * hours * electricityRate;
  }
  if (serviceType === 'gas' || serviceType === 'both') {
    cost += gasM3PerHour * hours * gasRate;
  }
  return Math.round(cost);
}
