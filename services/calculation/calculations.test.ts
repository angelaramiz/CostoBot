import {
    calculateMaterialCost,
    calculateUtensilDepreciation,
    calculateMachineCost,
    calculateMachineServiceCost,
    calculateInheritedCost,
    calculatePricing,
    calculateYield
} from "./calculations";

describe("calculateMaterialCost", () => {
    it("calcula costo total de material correctamente", () => {
        expect(calculateMaterialCost(500, 3)).toBe(1500);
    });

    it("retorna 0 si quantity es 0", () => {
        expect(calculateMaterialCost(500, 0)).toBe(0);
    });

    it("redondea al centavo entero", () => {
        // 333 * 3 = 999, no need to round but let's test float inputs
        expect(calculateMaterialCost(33, 3)).toBe(99);
    });

    it("retorna 0 si quantity es negativa", () => {
        expect(calculateMaterialCost(500, -1)).toBe(0);
    });
});

describe("calculateUtensilDepreciation", () => {
    it("calcula depreciación mensual correctamente", () => {
        // (10000 - 0) / 24 / 100 = ~4.17 → rounded = 4
        expect(calculateUtensilDepreciation(10000, 0, 24, 100)).toBe(4);
    });

    it("retorna 0 si usefulLifeMonths es 0", () => {
        expect(calculateUtensilDepreciation(10000, 0, 0, 100)).toBe(0);
    });

    it("retorna 0 si unitsProducedThisMonth es 0", () => {
        expect(calculateUtensilDepreciation(10000, 0, 24, 0)).toBe(0);
    });
});

describe("calculateMachineCost", () => {
    it("calcula costo por uso correctamente (30 min a 6000/hr)", () => {
        // (6000 / 60) * 30 * 1.0 / 1 = 3000
        expect(calculateMachineCost(6000, 30)).toBe(3000);
    });

    it("aplica factor de temperatura", () => {
        // (6000 / 60) * 30 * 1.2 / 1 = 3600
        expect(calculateMachineCost(6000, 30, 1.2)).toBe(3600);
    });
});

describe("calculateInheritedCost", () => {
    it("calcula costo proporcional correctamente", () => {
        // 1000 * (5 / 10) = 500
        expect(calculateInheritedCost(1000, 10, 5)).toBe(500);
    });

    it("retorna 0 si parentProductQuantity es 0", () => {
        expect(calculateInheritedCost(1000, 0, 5)).toBe(0);
    });
});

describe("calculatePricing", () => {
    it("calcula precio de venta y ganancia correctamente", () => {
        const result = calculatePricing(200, 50);
        expect(result.precioVenta).toBe(300);
        expect(result.ganancia).toBe(100);
    });

    it("maneja margen 0", () => {
        const result = calculatePricing(500, 0);
        expect(result.precioVenta).toBe(500);
        expect(result.ganancia).toBe(0);
    });
});

describe("calculateMachineServiceCost", () => {
    it("calcula costo eléctrico correctamente (1.5 kW × 60 min × tarifa 200)", () => {
        // 1.5 kW × (60/60) h × 200 cts/kWh = 300
        expect(calculateMachineServiceCost('electricity', 60, 1.5, 0, 200, 0)).toBe(300);
    });

    it("calcula costo de gas correctamente (0.5 m³/h × 30 min × tarifa 400)", () => {
        // 0.5 m³/h × (30/60) h × 400 cts/m³ = 100
        expect(calculateMachineServiceCost('gas', 30, 0, 0.5, 0, 400)).toBe(100);
    });

    it("calcula costo combinado (both) sumando electricidad y gas", () => {
        // Electricidad: 2 kW × (60/60) h × 200 = 400
        // Gas: 1 m³/h × (60/60) h × 150 = 150
        // Total: 550
        expect(calculateMachineServiceCost('both', 60, 2, 1, 200, 150)).toBe(550);
    });

    it("retorna 0 si no hay potencia ni consumo configurados", () => {
        expect(calculateMachineServiceCost('electricity', 60, 0, 0, 200, 0)).toBe(0);
    });

    it("retorna 0 si la tarifa es 0", () => {
        expect(calculateMachineServiceCost('gas', 60, 0, 1, 0, 0)).toBe(0);
    });

    it("ignora gas cuando serviceType es 'electricity'", () => {
        // Solo electricidad: 1 kW × 1 h × 100 = 100 (gas ignorado aunque tenga tarifa)
        expect(calculateMachineServiceCost('electricity', 60, 1, 5, 100, 500)).toBe(100);
    });

    it("ignora electricidad cuando serviceType es 'gas'", () => {
        // Solo gas: 2 m³/h × 1 h × 100 = 200 (electricidad ignorada aunque tenga tarifa)
        expect(calculateMachineServiceCost('gas', 60, 5, 2, 500, 100)).toBe(200);
    });

    it("redondea el resultado al centavo entero", () => {
        // 1 kW × (1/60) h × 10 = 0.1667 → Math.round = 0
        expect(calculateMachineServiceCost('electricity', 1, 1, 0, 10, 0)).toBe(0);
        // 1 kW × (30/60) h × 13 = 6.5 → Math.round = 7
        expect(calculateMachineServiceCost('electricity', 30, 1, 0, 13, 0)).toBe(7);
    });
});

describe("calculateYield", () => {
    it("calcula rendimiento 80% correctamente", () => {
        expect(calculateYield(100, 80)).toBeCloseTo(0.8);
    });

    it("calcula rendimiento 100% cuando input === output", () => {
        expect(calculateYield(50, 50)).toBeCloseTo(1.0);
    });

    it("calcula rendimiento mayor a 1 si output supera el input", () => {
        expect(calculateYield(10, 15)).toBeCloseTo(1.5);
    });

    it("retorna 0 si inputTotal es 0 (división por cero)", () => {
        expect(calculateYield(0, 80)).toBe(0);
    });

    it("retorna 0 si inputTotal es negativo", () => {
        expect(calculateYield(-5, 80)).toBe(0);
    });

    it("retorna 0 si expectedOutput es 0", () => {
        expect(calculateYield(100, 0)).toBeCloseTo(0);
    });
});
