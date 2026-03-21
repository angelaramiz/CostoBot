'use client';

import { create } from 'zustand';
import { propagateChange, recalculateAllLayers } from '@/services/calculation/cascade-engine';
import { buildDependencyGraph } from '@/services/calculation/dependency-graph';
import type { BusinessProject, ProjectLayers } from '@/types/business-project';
import type { Insumo } from '@/types/layer1-insumos';
import type { Proceso } from '@/types/layer2-procesos';
import type { Producto } from '@/types/layer3-productos';
import type { Precio } from '@/types/layer4-precios';
import type { DependencyGraph } from '@/services/calculation/dependency-graph';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const DEBOUNCE_MS = 5000;

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
  updateInsumo: (id: string, changes: Partial<Insumo>, token: string) => void;
  updateProceso: (id: string, changes: Partial<Proceso>, token: string) => void;
  updateProducto: (id: string, changes: Partial<Producto>, token: string) => void;
  updatePrecio: (id: string, changes: Partial<Precio>, token: string) => void;
  addInsumo: (item: Insumo, token: string) => void;
  removeInsumo: (id: string, token: string) => void;
  addProceso: (item: Proceso, token: string) => void;
  removeProceso: (id: string, token: string) => void;
  addProducto: (item: Producto, token: string) => void;
  removeProducto: (id: string, token: string) => void;
  addPrecio: (item: Precio, token: string) => void;
  removePrecio: (id: string, token: string) => void;
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

      // Convertir fechas de string a Date
      const project: BusinessProject = {
        ...data,
        id: data._id ?? data.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
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

    // Cancelar debounce anterior y programar nuevo auto-guardado
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

  // ── updateProceso ─────────────────────────────────────────────────────────
  updateProceso: (id, changes, token) => {
    const { _applyChange } = get();
    for (const [field, value] of Object.entries(changes)) {
      if (value !== undefined) {
        _applyChange('layer2', id, field, value as number | string, token);
      }
    }
  },

  // ── updateProducto ────────────────────────────────────────────────────────
  updateProducto: (id, changes, token) => {
    const { _applyChange } = get();
    for (const [field, value] of Object.entries(changes)) {
      if (value !== undefined) {
        _applyChange('layer3', id, field, value as number | string, token);
      }
    }
  },

  // ── updatePrecio ──────────────────────────────────────────────────────────
  updatePrecio: (id, changes, token) => {
    const { _applyChange } = get();
    for (const [field, value] of Object.entries(changes)) {
      if (value !== undefined) {
        _applyChange('layer4', id, field, value as number | string, token);
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

    // Sincronizar inmediatamente con el backend (PATCH del proyecto actual)
    await get().saveProject(token);
  },


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
          layer2: p.layers.layer2.map((proc) => ({
            ...proc,
            insumoIds: proc.insumoIds.filter((iid) => iid !== id),
          })),
        },
      }),
      token
    ),

  // ── Procesos ──────────────────────────────────────────────────────────────
  addProceso: (item, token) =>
    get()._applyStructural(
      (p) => ({ ...p, layers: { ...p.layers, layer2: [...p.layers.layer2, item] } }),
      token
    ),

  removeProceso: (id, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer2: p.layers.layer2.filter((pr) => pr.id !== id),
          layer3: p.layers.layer3.map((prod) => ({
            ...prod,
            procesoIds: prod.procesoIds.filter((pid) => pid !== id),
          })),
        },
      }),
      token
    ),

  // ── Productos ─────────────────────────────────────────────────────────────
  addProducto: (item, token) =>
    get()._applyStructural(
      (p) => ({ ...p, layers: { ...p.layers, layer3: [...p.layers.layer3, item] } }),
      token
    ),

  removeProducto: (id, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: {
          ...p.layers,
          layer3: p.layers.layer3.filter((pr) => pr.id !== id),
          layer4: p.layers.layer4.filter((precio) => precio.productoId !== id),
        },
      }),
      token
    ),

  // ── Precios ───────────────────────────────────────────────────────────────
  addPrecio: (item, token) =>
    get()._applyStructural(
      (p) => ({ ...p, layers: { ...p.layers, layer4: [...p.layers.layer4, item] } }),
      token
    ),

  removePrecio: (id, token) =>
    get()._applyStructural(
      (p) => ({
        ...p,
        layers: { ...p.layers, layer4: p.layers.layer4.filter((pr) => pr.id !== id) },
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
      } as BusinessProject;
    } catch {
      return null;
    }
  },
}));
