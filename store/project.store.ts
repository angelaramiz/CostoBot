'use client';

import { create } from 'zustand';
import { propagateChange } from '@/lib/cascade-engine';
import { buildDependencyGraph } from '@/lib/dependency-graph';
import type { BusinessProject, ProjectLayers } from '@/types/business-project';
import type { Insumo } from '@/types/layer1-insumos';
import type { Proceso } from '@/types/layer2-procesos';
import type { Producto } from '@/types/layer3-productos';
import type { Precio } from '@/types/layer4-precios';
import type { DependencyGraph } from '@/lib/dependency-graph';

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
  updateInsumo: (id: string, changes: Partial<Insumo>, token: string) => void;
  updateProceso: (id: string, changes: Partial<Proceso>, token: string) => void;
  updateProducto: (id: string, changes: Partial<Producto>, token: string) => void;
  updatePrecio: (id: string, changes: Partial<Precio>, token: string) => void;
  /** Uso interno: propaga un cambio a través del cascade engine */
  _applyChange: (
    layerId: keyof ProjectLayers,
    itemId: string,
    field: string,
    newValue: number | string,
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
}));
