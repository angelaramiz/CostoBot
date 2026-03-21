import { BusinessProjectSchema } from './business-project.schema';

const validProject = {
  id: 'proj-001',
  name: 'Proyecto Test',
  ownerId: 'firebase-uid-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  layers: {
    layer1: [
      { id: 'ins-001', name: 'Harina', unit: 'kg', costPerUnit: 150, quantity: 2 },
    ],
    layer2: [
      {
        id: 'proc-001',
        name: 'Mezcla',
        insumoIds: ['ins-001'],
        laborCost: 500,
        totalCost: 800,
      },
    ],
    layer3: [
      { id: 'prod-001', name: 'Pan', procesoIds: ['proc-001'], costoUnitario: 800 },
    ],
    layer4: [
      {
        id: 'prec-001',
        productoId: 'prod-001',
        margenPorcentaje: 30,
        precioVenta: 1040,
        roi: 30,
      },
    ],
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

  it('debe rechazar laborCost con decimal (no es entero en centavos)', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer2: [{ ...validProject.layers.layer2[0], laborCost: 1.5 }],
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('centavos'))
      ).toBe(true);
    }
  });

  it('debe rechazar costoUnitario negativo', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer3: [{ ...validProject.layers.layer3[0], costoUnitario: -50 }],
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar precioVenta negativo', () => {
    const invalid = {
      ...validProject,
      layers: {
        ...validProject.layers,
        layer4: [{ ...validProject.layers.layer4[0], precioVenta: -10 }],
      },
    };
    const result = BusinessProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe aceptar capas vacías (proyecto sin datos aún)', () => {
    const empty = {
      ...validProject,
      layers: { layer1: [], layer2: [], layer3: [], layer4: [] },
    };
    const result = BusinessProjectSchema.safeParse(empty);
    expect(result.success).toBe(true);
  });
});
