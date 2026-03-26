'use client';

import { create } from 'zustand';
import {
  propagateChange,
  propagateGraphChange,
  recalculateAllLayers,
} from '@/services/calculation/cascade-engine';
import { buildDependencyGraph } from '@/services/calculation/dependency-graph';
import type { BusinessProject, ProjectLayers } from '@/types/business-project';
import type { Insumo } from '@/types/layer1-insumos';
import type { ProductGraph } from '@/types/layer2-productos';
import type { ProductPricing, Layer3Precios } from '@/types/layer3-precios';
import type { DependencyGraph } from '@/services/calculation/dependency-graph';
import { API_URL } from '@/lib/config';

const DEBOUNCE_MS = 5000;

/** Valores por defecto para Layer 3 */
const DEFAULT_LAYER3: Layer3Precios = {
  version: '1.0',
  updatedAt: new Date().toISOString(),
  services: {},
  taxes: {},
  products: [],
};

interface ProjectState {
  currentProject: BusinessProject | null;
  isDirty: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  /** Grafo de dependencias, reconstruido al cargar el proyecto */
  _dependencyGraph: DependencyGraph | null;
  /** Timer ID del debounce de auto-guardado */
  _debounceTimer: ReturnType<typeof setTimeout> | null;
}

interface ProjectActions {
  loadProject: (id: string, token: string) => Promise<void>;
  saveProject: (token: string) => Promise<void>;
  createProject: (name: string, token: string) => Promise<BusinessProject | null>;

  // ── Layer 1: Insumos ────────────────────────────────────────────────────
  updateInsumo: (id: string, changes: Partial<Insumo>, token: string) => void;
  addInsumo: (item: Insumo, token: string) => void;
  removeInsumo: (id: string, token: string) => void;

  // ── Layer 2: Grafos de Productos ────────────────────────────────────────
  updateProductGraph: (productId: string, graph: ProductGraph, token: string) => void;
  addProductGraph: (graph: ProductGraph, token: string) => void;
  removeProductGraph: (productId: string, token: string) => void;

  // ── Layer 3: Precios ────────────────────────────────────────────────────
  updateProductPricing: (productId: string, changes: Partial<ProductPricing>, token: string) => void;
  addProductPricing: (pricing: ProductPricing, token: string) => void;
  removeProductPricing: (productId: string, token: string) => void;

  /** Uso interno: propaga un cambio a través del cascade engine */
  _applyChange: (
    layerId: keyof ProjectLayers,
    itemId: string,
    field: string,
    newValue: number | string,
    token: string
  ) => void;
  /** Carga un proyecto importado desde JSON (reemplaza el proyecto actual) */
  loadFromImport: (project: BusinessProject, token: string) => Promise<void>;
  /** Uso interno: aplica mutación estructural y recalcula todo */
  _applyStructural: (
    mutate: (p: BusinessProject) => BusinessProject,
    token: string
  ) => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // ── Estado inicial ────────────────────────────────────────────────────────
  currentProject: null,
  isDirty: false,
  lastSyncedAt: null,
  syncError: null,
  _dependencyGraph: null,
  _debounceTimer: null,

  // ── loadProject ───────────────────────────────────────────────────────────
  loadProject: async (id, token) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Error ${res.status}`);
      }

      const { data } = await res.json();

      const project: BusinessProject = {
        ...data,
        id: data._id ?? data.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        layers: {
          layer1: data.layers?.layer1 ?? [],
          layer2: data.layers?.layer2 ?? [],
          layer3: data.layers?.layer3 ?? DEFAULT_LAYER3,
        },
      };

      set({
        currentProject: project,
        isDirty: false,
        lastSyncedAt: new Date(),
        syncError: null,
        _dependencyGraph: buildDependencyGraph(project),
      });
    } catch (err) {
      set({ syncError: err instanceof Error ? err.message : 'Error al cargar proyecto' });
    }
  },

  // ── saveProject ───────────────────────────────────────────────────────────
  saveProject: async (token) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const res = await fetch(`${API_URL}/api/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: currentProject.name,
          layers: currentProject.layers,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Error ${res.status}`);
      }

      set({ isDirty: false, lastSyncedAt: new Date(), syncError: null });
    } catch (err) {
      set({ syncError: err instanceof Error ? err.message : 'Error al guardar proyecto' });
    }
  },

  // ── _applyChange (interno) ────────────────────────────────────────────────
  _applyChange: (layerId, itemId, field, newValue, token) => {
    const { currentProject, _debounceTimer } = get();
    if (!currentProject) return;

    const updated = propagateChange(currentProject, layerId, itemId, field, newValue);

    if (_debounceTimer) clearTimeout(_debounceTimer);
    const timer = setTimeout(() => get().saveProject(token), DEBOUNCE_MS);

    set({
      currentProject: updated,
      isDirty: true,
      _dependencyGraph: buildDependencyGraph(updated),
      _debounceTimer: timer,
    });
  },

  // ── updateInsumo ─────────────────────────────────────────────────────────
  updateInsumo: (id, changes, token) => {
    const { _applyChange } = get();
    for (const [field, value] of Object.entries(changes)) {
      if (value !== undefined) {
        _applyChange('layer1', id, field, value as number | string, token);
      }
    }
  },

  // ── updateProductGraph ────────────────────────────────────────────────────
  updateProductGraph: (productId, graph, token) => {
    const { currentProject, _debounceTimer } = get();
    if (!currentProject) return;

    const updated = propagateGraphChange(currentProject, productId, graph);

    if (_debounceTimer) clearTimeout(_debounceTimer);
    const timer = setTimeout(() => get().saveProject(token), DEBOUNCE_MS);

    set({
      currentProject: updated,
      isDirty: true,
      _dependencyGraph: buildDependencyGraph(updated),
      _debounceTimer: timer,
    });
  },

  // ── updateProductPricing ──────────────────────────────────────────────────
  updateProductPricing: (productId, changes, token) => {
    const { _applyChange } = get();
    for (const [field, value] of Object.entries(changes)) {
      if (value !== undefined) {
        _applyChange('layer3', productId, field, value as number | string, token);
      }
    }
  },

  // ── _applyStructural (interno) ────────────────────────────────────────────
  _applyStructural: (mutate, token) => {
    const { currentProject, _debounceTimer } = get();
    if (!currentProject) return;
    const updated = recalculateAllLayers(mutate(structuredClone(currentProject)));
    if (_debounceTimer) clearTimeout(_debounceTimer);
    const timer = setTimeout(() => get().saveProject(token), DEBOUNCE_MS);
    set({
      currentProject: updated,
      isDirty: true,
      _dependencyGraph: buildDependencyGraph(updated),
      _debounceTimer: timer,
    });
  },

  // ── loadFromImport ────────────────────────────────────────────────────────
  loadFromImport: async (project, token) => {
    const { _debounceTimer } = get();
    if (_debounceTimer) clearTimeout(_debounceTimer);

    const recalculated = recalculateAllLayers(project);
    set({
      currentProject: recalculated,
      isDirty: true,
      lastSyncedAt: null,
      syncError: null,
      _dependencyGraph: buildDependencyGraph(recalculated),
      _debounceTimer: null,
    });

    await get().saveProject(token);
  },

  // ── Insumos (Layer 1) ────────────────────────────────────────────────────
  addInsumo: (item, token) =>
    get()._applyStructural(
      (p) => ({ ...p, layers: { ...p.layers, layer1: [...p.layers.layer1, item] } }),
      token
    ),

  removeInsumo: (id, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer1: p.layers.layer1.filter((i) => i.id !== id),
          // Limpiar nodos de grafos que referencien este insumo
          layer2: p.layers.layer2.map((graph) => ({
            ...graph,
            nodes: graph.nodes.filter((node) => {
              const data = node.data as unknown as Record<string, unknown>;
              return !('insumoId' in data && data['insumoId'] === id);
            }),
          })),
        },
      }),
      token
    ),

  // ── Grafos de Productos (Layer 2) ─────────────────────────────────────────
  addProductGraph: (graph, token) =>
    get()._applyStructural(
      (p) => ({ ...p, layers: { ...p.layers, layer2: [...p.layers.layer2, graph] } }),
      token
    ),

  removeProductGraph: (productId, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer2: p.layers.layer2.filter((g) => g.productId !== productId),
          layer3: {
            ...p.layers.layer3,
            products: p.layers.layer3.products.filter(
              (pr) => pr.productId !== productId
            ),
          },
        },
      }),
      token
    ),

  // ── Precios (Layer 3) ─────────────────────────────────────────────────────
  addProductPricing: (pricing, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer3: {
            ...p.layers.layer3,
            products: [...p.layers.layer3.products, pricing],
          },
        },
      }),
      token
    ),

  removeProductPricing: (productId, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer3: {
            ...p.layers.layer3,
            products: p.layers.layer3.products.filter(
              (pr) => pr.productId !== productId
            ),
          },
        },
      }),
      token
    ),

  // ── createProject ─────────────────────────────────────────────────────────
  createProject: async (name, token) => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const { data } = await res.json();
      return {
        ...data,
        id: data._id ?? data.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        layers: {
          layer1: data.layers?.layer1 ?? [],
          layer2: data.layers?.layer2 ?? [],
          layer3: data.layers?.layer3 ?? DEFAULT_LAYER3,
        },
      } as BusinessProject;
    } catch {
      return null;
    }
  },
}));
