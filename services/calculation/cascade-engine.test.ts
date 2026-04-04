import { propagateChange, recalculateAllLayers } from './cascade-engine';
import type { BusinessProject } from '@/types/business-project';

/**
 * Estado base para las pruebas (nueva estructura 3 capas):
 *   ins-001: Harina, costPerUnit=100, quantity=2, ingrediente
 *   prod-001: Grafo "Pan" con nodo ingrediente (ins-001, qty=2) → resultado
 *     totalCost = 100*2 = 200
 *   pricing prod-001: margen=50% → precioVenta = 200 * 1.5 = 300, roi=50
 */
const baseProject: BusinessProject = {
  id: 'proj-001',
  name: 'Proyecto Test',
  ownerId: 'firebase-uid-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  layers: {
    layer1: [
      {
        id: 'ins-001',
        name: 'Harina',
        unit: 'kg',
        costPerUnit: 100,
        quantity: 2,
        category: 'ingrediente',
        isReusable: false,
      },
    ],
    layer2: [
      {
        productId: 'prod-001',
        productName: 'Pan',
        version: '1.0',
        nodes: [
          {
            id: 'node-001',
            type: 'ingredient',
            position: { x: 100, y: 200 },
            data: { insumoId: 'ins-001', insumoName: 'Harina', quantity: 2, unit: 'kg' },
          },
          {
            id: 'node-002',
            type: 'resultado',
            position: { x: 400, y: 200 },
            data: {
              mainProduct: { name: 'Pan', expectedQuantity: 10, unit: 'piezas' },
              inputTotal: 2,
              yield: 0.8,
            },
          },
        ],
        edges: [{ id: 'edge-001', source: 'node-001', target: 'node-002' }],
        totalCost: 200,
        laborCost: 0,
      },
    ],
    layer3: {
      version: '1.0',
      updatedAt: '2026-01-01T00:00:00.000Z',
      services: {},
      taxes: {},
      products: [
        {
          productId: 'prod-001',
          productName: 'Pan',
          costBreakdown: {
            ingredients: 200,
            machines: 0,
            utensils: 0,
            services: 0,
            labor: 0,
            totalCost: 200,
          },
          margenPorcentaje: 50,
          precioVenta: 300,
          ganancia: 50,
        },
      ],
    },
  },
};

describe('propagateChange — cascada L1 → L2 → L3', () => {
  it('recalcula grafo totalCost cuando cambia insumo.costPerUnit', () => {
    // costPerUnit: 100 → 200 | rawCost = 200*2 = 400
    // Resultado tiene yield=0.8 → effectiveCost = Math.round(400 / 0.8) = 500
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const graph = result.layers.layer2.find((g) => g.productId === 'prod-001')!;
    expect(graph.totalCost).toBe(500);
  });

  it('recalcula pricing precioVenta en cascada completa', () => {
    // totalCost=500 (con yield aplicado), margen=50% → precioVenta = 500 * 1.5 = 750
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.precioVenta).toBe(750);
  });

  it('calcula la ganancia correctamente después de la cascada', () => {
    // precioVenta=750, totalCost=500 → ganancia = 250
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.ganancia).toBe(250);
  });
});

describe('propagateChange — no mutación del proyecto original', () => {
  it('no debe mutar el totalCost del grafo original', () => {
    const originalTotalCost = baseProject.layers.layer2[0].totalCost;
    propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    expect(baseProject.layers.layer2[0].totalCost).toBe(originalTotalCost);
  });

  it('no debe mutar el pricing original', () => {
    const originalPrecio = baseProject.layers.layer3.products[0].precioVenta;
    propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    expect(baseProject.layers.layer3.products[0].precioVenta).toBe(originalPrecio);
  });
});

describe('propagateChange — ID inexistente', () => {
  it('retorna el proyecto sin cambios si el itemId no existe', () => {
    const result = propagateChange(baseProject, 'layer1', 'no-existe', 'costPerUnit', 999);
    expect(result.layers.layer1[0].costPerUnit).toBe(100);
  });
});

describe('propagateChange — insumo tipo material', () => {
  const projectWithMaterial: BusinessProject = {
    ...baseProject,
    layers: {
      ...baseProject.layers,
      layer1: [
        ...baseProject.layers.layer1,
        {
          id: 'mat-001',
          name: 'Papel de empaque',
          unit: 'pza',
          costPerUnit: 50,
          quantity: 10,
          category: 'material',
          isReusable: false,
          supplier: 'Proveedor ABC',
          sku: 'PAP-001',
        },
      ],
      layer2: [
        {
          ...baseProject.layers.layer2[0],
          nodes: [
            ...baseProject.layers.layer2[0].nodes,
            {
              id: 'node-mat-001',
              type: 'ingredient',
              position: { x: 200, y: 200 },
              data: { insumoId: 'mat-001', insumoName: 'Papel de empaque', quantity: 5, unit: 'pza' },
            },
          ],
          totalCost: 200 + 50 * 5, // 450
        },
      ],
    },
  };

  it('propaga cambio de costPerUnit de material a Layer 2', () => {
    // mat-001.costPerUnit: 50 → 100 | material qty=5 → 500
    // rawCost = 200 (ins-001) + 500 (mat-001) = 700
    // Resultado tiene yield=0.8 → effectiveCost = Math.round(700 / 0.8) = 875
    const result = propagateChange(projectWithMaterial, 'layer1', 'mat-001', 'costPerUnit', 100);
    const graph = result.layers.layer2.find((g) => g.productId === 'prod-001')!;
    expect(graph.totalCost).toBe(875);
  });

  it('el insumo material incluye campos supplier y sku', () => {
    const mat = projectWithMaterial.layers.layer1.find((i) => i.id === 'mat-001')!;
    expect(mat.supplier).toBe('Proveedor ABC');
    expect(mat.sku).toBe('PAP-001');
  });
});

// ─── ROI e impuestos en Layer 3 ─────────────────────────────────────────────

describe('propagateChange — ROI y campos de impuestos en L3', () => {
  /**
   * ins-001.costPerUnit: 100 → 200  |  quantity=2, yield=0.8
   * totalCost = Math.round(200*2 / 0.8) = 500
   * margen 50% → precioVenta = 500 * 1.5 = 750, ganancia = 250
   */

  it('popula roi después de propagación (sin impuestos): ganancia=250, precioVenta=750 → roi=33', () => {
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.roi).toBe(33);
  });

  it('precioVentaConImpuestos igual a precioVenta cuando no hay impuestos', () => {
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.precioVentaConImpuestos).toBe(750);
  });

  it('calcula precioVentaConImpuestos con IVA 16%: round(750 * 1.16) = 870', () => {
    const projectWithIVA: BusinessProject = {
      ...baseProject,
      layers: {
        ...baseProject.layers,
        layer3: {
          ...baseProject.layers.layer3,
          taxes: { iva: { name: 'IVA', rate: 0.16, enabled: true } },
        },
      },
    };
    const result = propagateChange(projectWithIVA, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.precioVentaConImpuestos).toBe(870);
    expect(pricing.totalTaxRate).toBe(0.16);
  });

  it('roi con IVA 16%: ganancia=250, precioConIVA=870 → roi=round(250/870*100)=29', () => {
    const projectWithIVA: BusinessProject = {
      ...baseProject,
      layers: {
        ...baseProject.layers,
        layer3: {
          ...baseProject.layers.layer3,
          taxes: { iva: { name: 'IVA', rate: 0.16, enabled: true } },
        },
      },
    };
    const result = propagateChange(projectWithIVA, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.roi).toBe(29);
  });

  it('impuesto deshabilitado (enabled=false) no afecta precioVentaConImpuestos', () => {
    const projectWithDisabledTax: BusinessProject = {
      ...baseProject,
      layers: {
        ...baseProject.layers,
        layer3: {
          ...baseProject.layers.layer3,
          taxes: { iva: { name: 'IVA', rate: 0.16, enabled: false } },
        },
      },
    };
    const result = propagateChange(projectWithDisabledTax, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.precioVentaConImpuestos).toBe(750);
    expect(pricing.totalTaxRate).toBe(0);
  });
});

// ─── syncL2ToL3 / recalculateAllLayers ──────────────────────────────────────

describe('recalculateAllLayers — syncL2ToL3 auto-sincronización', () => {
  it('crea entrada de pricing para grafo L2 que no tiene precio en L3', () => {
    const projectSinPricing: BusinessProject = {
      ...baseProject,
      layers: {
        ...baseProject.layers,
        layer3: {
          ...baseProject.layers.layer3,
          products: [],
        },
      },
    };
    const result = recalculateAllLayers(projectSinPricing);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001');
    expect(pricing).toBeDefined();
    expect(pricing?.productName).toBe('Pan');
  });

  it('no duplica entradas existentes en L3 al recalcular', () => {
    const result = recalculateAllLayers(baseProject);
    const count = result.layers.layer3.products.filter((p) => p.productId === 'prod-001').length;
    expect(count).toBe(1);
  });

  it('no muta el proyecto original al recalcular', () => {
    const originalCount = baseProject.layers.layer3.products.length;
    recalculateAllLayers(baseProject);
    expect(baseProject.layers.layer3.products.length).toBe(originalCount);
  });

  it('recalcula correctamente totalCost del grafo existente', () => {
    // ins-001.costPerUnit=100, quantity=2, yield=0.8 → totalCost = round(200/0.8) = 250
    const result = recalculateAllLayers(baseProject);
    const graph = result.layers.layer2.find((g) => g.productId === 'prod-001')!;
    expect(graph.totalCost).toBe(250);
  });
});
