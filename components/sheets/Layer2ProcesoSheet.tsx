'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { ProductGraph } from '@/types/layer2-productos';
import NodeEditor from './layer2/NodeEditor';
import styles from '@/components/ui/Sheet.module.css';
import editorStyles from './layer2/NodeEditor.module.css';

export default function Layer2ProcesoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const addProductGraph = useProjectStore((s) => s.addProductGraph);
  const updateProductGraph = useProjectStore((s) => s.updateProductGraph);
  const removeProductGraph = useProjectStore((s) => s.removeProductGraph);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  if (!project) return null;

  const graphs = project.layers.layer2;
  const insumos = project.layers.layer1;
  const selectedGraph = graphs.find((g) => g.productId === selectedId) ?? graphs[0] ?? null;

  function handleAddGraph() {
    if (!newName.trim()) return;
    const graph: ProductGraph = {
      productId: crypto.randomUUID(),
      productName: newName.trim(),
      version: '1.0',
      nodes: [],
      edges: [],
      totalCost: 0,
      laborCost: 0,
    };
    addProductGraph(graph, token);
    setSelectedId(graph.productId);
    setNewName('');
    setShowNewForm(false);
  }

  function handleSaveGraph(updated: ProductGraph) {
    updateProductGraph(updated.productId, updated, token);
  }

  function handleRemoveGraph(productId: string) {
    removeProductGraph(productId, token);
    if (selectedId === productId) {
      const remaining = graphs.filter((g) => g.productId !== productId);
      setSelectedId(remaining[0]?.productId ?? null);
    }
  }

  return (
    <div className={styles.sheetWrapper} style={{ padding: 0, flexDirection: 'column', gap: 0 }}>
      {/* Barra de selección de producto */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          minHeight: 48,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
          Producto:
        </span>
        {graphs.length > 0 && (
          <select
            className={editorStyles.graphSelect}
            value={selectedGraph?.productId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {graphs.map((g) => (
              <option key={g.productId} value={g.productId}>
                {g.productName}
              </option>
            ))}
          </select>
        )}

        {showNewForm ? (
          <>
            <input
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 5,
                color: '#e2e8f0',
                padding: '5px 8px',
                fontSize: '0.82rem',
                outline: 'none',
              }}
              autoFocus
              placeholder="Nombre del producto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGraph();
                if (e.key === 'Escape') setShowNewForm(false);
              }}
            />
            <button className={editorStyles.toolbarBtn} style={{ background: '#1d4ed8', color: '#fff', borderColor: '#3b82f6' }} onClick={handleAddGraph}>
              Crear
            </button>
            <button className={editorStyles.toolbarBtn} onClick={() => setShowNewForm(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button className={editorStyles.toolbarBtn} onClick={() => setShowNewForm(true)}>
            + Nuevo producto
          </button>
        )}

        {selectedGraph && (
          <button
            className={editorStyles.toolbarBtnDanger}
            style={{ marginLeft: 'auto' }}
            onClick={() => handleRemoveGraph(selectedGraph.productId)}
          >
            🗑 Eliminar producto
          </button>
        )}
      </div>

      {/* Canvas del editor */}
      {graphs.length === 0 ? (
        <div className={editorStyles.emptyCanvas}>
          <span className={editorStyles.emptyIcon}>🗂</span>
          <span>Sin grafos de producto.</span>
          <span>Crea tu primer producto con el botón &ldquo;+ Nuevo producto&rdquo; de arriba.</span>
        </div>
      ) : selectedGraph ? (
        <div style={{ flex: 1, minHeight: 520 }}>
          <NodeEditor
            key={selectedGraph.productId}
            graph={selectedGraph}
            insumos={insumos}
            onSave={handleSaveGraph}
          />
        </div>
      ) : null}
    </div>
  );
}
