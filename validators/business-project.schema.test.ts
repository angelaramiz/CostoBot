import { BusinessProjectSchema } from './business-project.schema';

const validProject = {
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
        costPerUnit: 150,
        quantity: 2,
        category: 'ingrediente' as const,
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
        totalCost: 300,
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
            ingredients: 300,
            machines: 0,
            utensils: 0,
            services: 0,
            labor: 0,
            totalCost: 300,
          },
          margenPorcentaje: 30,
          precioVenta: 390,
          ganancia: 30,
        },
      ],
    },
  },
};

describe('BusinessProjectSchema', () => {
  it('debe validar un proyecto válido', () => {
    const result = BusinessProjectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('debe rechazar un ID de proyecto vacío', () => {
    const invalid = { ...validProject, id: '' };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar un nombre de proyecto vacío', () => {
    const invalid = { ...validProject, name: '' };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar costPerUnit negativo', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer1: [{ ...validProject.layers.layer1[0], costPerUnit: -100 }],
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('negativo'))
      ).toBe(true);
    }
  });

  it('debe rechazar precioVenta negativo en products de layer3', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer3: {
          ...validProject.layers.layer3,
          products: [
            { ...validProject.layers.layer3.products[0], precioVenta: -10 },
          ],
        },
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar totalCost negativo en costBreakdown', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer3: {
          ...validProject.layers.layer3,
          products: [
            {
              ...validProject.layers.layer3.products[0],
              costBreakdown: {
                ...validProject.layers.layer3.products[0].costBreakdown,
                totalCost: -50,
              },
            },
          ],
        },
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe aceptar capas vacías (proyecto sin datos aún)', () => {
    const empty = {
      ...validProject,
      layers: {
        layer1: [],
        layer2: [],
        layer3: {
          version: '1.0',
          updatedAt: '2026-01-01T00:00:00.000Z',
          services: {},
          taxes: {},
          products: [],
        },
      },
    };
    const result = BusinessProjectSchema.safeParse(empty);
    expect(result.success).toBe(true);
  });

  it('debe rechazar categoría de insumo inválida', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer1: [{ ...validProject.layers.layer1[0], category: 'invalida' }],
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
