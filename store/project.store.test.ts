/**
 * Tests del Zustand store de proyectos.
 * Usa mocks para fetch y el cascade engine.
 */
import { act } from 'react';
import { useProjectStore } from './project.store';
import type { BusinessProject } from '@/types/business-project';

// ── Proyecto de prueba ─────────────────────────────────────────────────────
const mockProject: BusinessProject = {
  id: 'proj-001',
  name: 'Test Project',
  ownerId: 'uid-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  layers: {
    layer1: [{ id: 'ins-001', name: 'Harina', unit: 'kg', costPerUnit: 100, quantity: 2 }],
    layer2: [{ id: 'proc-001', name: 'Mezcla', insumoIds: ['ins-001'], laborCost: 200, totalCost: 400 }],
    layer3: [{ id: 'prod-001', name: 'Pan', procesoIds: ['proc-001'], costoUnitario: 400 }],
    layer4: [{ id: 'prec-001', productoId: 'prod-001', margenPorcentaje: 50, precioVenta: 600, roi: 50 }],
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

describe('useProjectStore — updateInsumo', () => {
  beforeEach(() => {
    resetStore();
    mockFetch.mockClear();
    useProjectStore.setState({ currentProject: mockProject });
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

  it('propaga el cambio en cascada al proceso referenciado', () => {
    // costPerUnit 100 → 200, quantity=2, laborCost=200 → totalCost = 200*2 + 200 = 600
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    const state = useProjectStore.getState();
    const proceso = state.currentProject!.layers.layer2.find((p) => p.id === 'proc-001')!;
    expect(proceso.totalCost).toBe(600);
  });

  it('propaga el cambio hasta el precio (cascada completa)', () => {
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    const state = useProjectStore.getState();
    const precio = state.currentProject!.layers.layer4.find((p) => p.id === 'prec-001')!;
    // costoUnitario=600, margen=50% → precioVenta = 600 * 1.5 = 900
    expect(precio.precioVenta).toBe(900);
  });

  it('no muta el proyecto original (inmutabilidad)', () => {
    const originalCosto = mockProject.layers.layer3[0].costoUnitario;
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    expect(mockProject.layers.layer3[0].costoUnitario).toBe(originalCosto);
  });

  it('activa auto-guardado con debounce al modificar', () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    useProjectStore.getState().updateInsumo('ins-001', { costPerUnit: 200 }, 'token');
    expect(mockFetch).not.toHaveBeenCalled(); // No debe guardar inmediatamente
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
