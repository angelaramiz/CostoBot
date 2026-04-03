import {
    calculateMaterialCost,
    calculateUtensilDepreciation,
    calculateMachineCost,
    calculateInheritedCost,
    calculatePricing
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
