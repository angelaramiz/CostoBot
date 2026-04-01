import { propagateChange } from './cascade-engine';
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
    // costPerUnit: 100 → 200 | grafo cost = 200*2 = 400
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const graph = result.layers.layer2.find((g) => g.productId === 'prod-001')!;
    expect(graph.totalCost).toBe(400);
  });

  it('recalcula pricing precioVenta en cascada completa', () => {
    // totalCost=400, margen=50% → precioVenta = 400 * 1.5 = 600
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.precioVenta).toBe(600);
  });

  it('calcula el ROI correctamente después de la cascada', () => {
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const pricing = result.layers.layer3.products.find((p) => p.productId === 'prod-001')!;
    expect(pricing.roi).toBe(50);
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
