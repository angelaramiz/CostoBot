/**
 * Tests del Zustand store de proyectos.
 * Arquitectura de 3 capas: Insumos → Grafos de Productos → Precios.
 */
import { act } from 'react';
import { useProjectStore } from './project.store';
import type { BusinessProject } from '@/types/business-project';

// ── Proyecto de prueba (nueva estructura 3 capas) ──────────────────────────
const mockProject: BusinessProject = {
  id: 'proj-001',
  name: 'Test Project',
  ownerId: 'uid-123',
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

// ── Mock de fetch ──────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helpers ────────────────────────────────────────────────────────────────
function resetStore() {
  useProjectStore.setState({
    currentProject: null,
    isDirty: false,
    lastSyncedAt: null,
    syncError: null,
    _dependencyGraph: null,
    _debounceTimer: null,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('useProjectStore — loadProject', () => {
  beforeEach(() => {
    resetStore();
    mockFetch.mockClear();
  });

  it('carga el proyecto y actualiza el estado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { ...mockProject, _id: 'proj-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      }),
    });

    await act(async () => {
      await useProjectStore.getState().loadProject('proj-001', 'fake-token');
    });

    const state = useProjectStore.getState();
    expect(state.currentProject?.id).toBe('proj-001');
    expect(state.isDirty).toBe(false);
    expect(state.lastSyncedAt).not.toBeNull();
    expect(state.syncError).toBeNull();
    expect(state._dependencyGraph).not.toBeNull();
  });

  it('registra syncError si la petición falla', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No encontrado' }),
    });

    await act(async () => {
      await useProjectStore.getState().loadProject('bad-id', 'fake-token');
    });

    expect(useProjectStore.getState().syncError).toBe('No encontrado');
    expect(useProjectStore.getState().currentProject).toBeNull();
  });
});

describe('useProjectStore — updateInsumo (cascada 3 capas)', () => {
  beforeEach(() => {
    resetStore();
    mockFetch.mockClear();
    useProjectStore.setState({ currentProject: structuredClone(mockProject) });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('marca isDirty = true después de actualizar un insumo', () => {
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it('propaga el cambio en cascada al grafo del producto', () => {
    // costPerUnit 100 → 200, quantity en nodo=2 → totalCost = 200*2 = 400
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    const state = useProjectStore.getState();
    const graph = state.currentProject!.layers.layer2.find((g) => g.productId === 'prod-001')!;
    expect(graph.totalCost).toBe(400);
  });

  it('propaga el cambio hasta el pricing (cascada completa)', () => {
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    const state = useProjectStore.getState();
    const pricing = state.currentProject!.layers.layer3.products.find(
      (p) => p.productId === 'prod-001'
    )!;
    // totalCost=400, margen=50% → precioVenta = 400 * 1.5 = 600
    expect(pricing.precioVenta).toBe(600);
  });

  it('no muta el proyecto original (inmutabilidad)', () => {
    const originalCost = mockProject.layers.layer3.products[0].costBreakdown.totalCost;
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    expect(mockProject.layers.layer3.products[0].costBreakdown.totalCost).toBe(originalCost);
  });

  it('activa auto-guardado con debounce al modificar', () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    expect(mockFetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('useProjectStore — saveProject', () => {
  beforeEach(() => {
    resetStore();
    mockFetch.mockClear();
  });

  it('hace PATCH al backend y limpia isDirty', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });
    useProjectStore.setState({ currentProject: mockProject, isDirty: true });

    await act(async () => {
      await useProjectStore.getState().saveProject('token');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/proj-001'),
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('no llama a fetch si no hay proyecto cargado', async () => {
    await act(async () => {
      await useProjectStore.getState().saveProject('token');
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
