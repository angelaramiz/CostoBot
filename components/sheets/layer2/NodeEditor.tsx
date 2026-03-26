'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import IngredientNode from './nodes/IngredientNode';
import MachineNode from './nodes/MachineNode';
import UtensilNode from './nodes/UtensilNode';
import ResultadoNode from './nodes/ResultadoNode';
import NodePropsPanel from './NodePropsPanel';
import type { ProductGraph, ProductNode, ProductEdge } from '@/types/layer2-productos';
import type { Insumo } from '@/types/layer1-insumos';
import styles from './NodeEditor.module.css';

const NODE_TYPES = {
  ingredient: IngredientNode,
  machine: MachineNode,
  utensil: UtensilNode,
  resultado: ResultadoNode,
};

const PALETTE = [
  { type: 'ingredient', label: 'Insumo', icon: '🌿' },
  { type: 'utensil', label: 'Utensilio', icon: '🔧' },
  { type: 'machine', label: 'Máquina', icon: '⚙️' },
  { type: 'resultado', label: 'Resultado', icon: '🎯' },
] as const;

function toFlowNodes(nodes: ProductNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data as unknown as Record<string, unknown>,
  }));
}

function toFlowEdges(edges: ProductEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    data: (e.data ?? {}) as Record<string, unknown>,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f680', strokeWidth: 2 },
  }));
}

interface Props {
  graph: ProductGraph;
  insumos: Insumo[];
  onSave: (graph: ProductGraph) => void;
}

export default function NodeEditor({ graph, insumos, onSave }: Props) {
  const [nodes, setNodes] = useState<Node[]>(() => toFlowNodes(graph.nodes));
  const [edges, setEdges] = useState<Edge[]>(() => toFlowEdges(graph.edges));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync when graph changes (different product selected)
  useEffect(() => {
    setNodes(toFlowNodes(graph.nodes));
    setEdges(toFlowEdges(graph.edges));
    setSelectedNode(null);
    setIsDirty(false);
  }, [graph.productId]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    setIsDirty(true);
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    setIsDirty(true);
  }, []);

  const onConnect = useCallback((conn: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...conn,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f680', strokeWidth: 2 },
        },
        eds
      )
    );
    setIsDirty(true);
  }, []);

  function handleAddNode(type: typeof PALETTE[number]['type']) {
    const id = crypto.randomUUID();
    const position = { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 };
    let data: Record<string, unknown> = {};

    if (type === 'ingredient') data = { insumoId: '', insumoName: 'Nuevo insumo', quantity: 1, unit: 'pza' };
    if (type === 'machine') data = { insumoId: '', insumoName: 'Nueva máquina', timeMinutes: 10, temperature: undefined, temperatureUnit: 'C' };
    if (type === 'utensil') data = { insumoId: '', insumoName: 'Nuevo utensilio', unitsProducedThisMonth: 1 };
    if (type === 'resultado') data = {
      mainProduct: { name: graph.productName, expectedQuantity: 1, unit: 'pza' },
      inputTotal: 0,
      yield: 1,
    };

    const newNode: Node = { id, type, position, data };
    setNodes((prev) => [...prev, newNode]);
    setIsDirty(true);
  }

  function handleNodePropsSave(nodeId: string, data: Record<string, unknown>) {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data } : n))
    );
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } : prev));

    // Recalculate yield for resultado nodes
    if (data.inputTotal != null && data.mainProduct != null) {
      const mp = data.mainProduct as { expectedQuantity?: number };
      const inputTotal = Number(data.inputTotal) || 0;
      const expectedQty = Number(mp.expectedQuantity) || 0;
      const yieldVal = inputTotal > 0 ? expectedQty / inputTotal : 0;
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, data: { ...data, yield: yieldVal } } : n))
      );
    }
    setIsDirty(true);
  }

  function handleDeleteSelected() {
    if (!selectedNode) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setIsDirty(true);
  }

  function buildSavePayload(): ProductGraph {
    const productNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type as ProductNode['type'],
      position: n.position,
      data: n.data as unknown as ProductNode['data'],
    }));
    const productEdges: ProductEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data as ProductEdge['data'],
    }));
    return {
      ...graph,
      nodes: productNodes,
      edges: productEdges,
    };
  }

  function handleSave() {
    onSave(buildSavePayload());
    setIsDirty(false);
  }

  return (
    <div className={styles.editorWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{graph.productName}</span>
        {selectedNode && (
          <button
            className={styles.toolbarBtnDanger}
            onClick={handleDeleteSelected}
          >
            🗑 Eliminar nodo
          </button>
        )}
        <span className={styles.toolbarSep} />
        <button
          className={styles.toolbarBtn}
          onClick={handleSave}
          style={isDirty ? { background: '#1d4ed8', color: '#fff', borderColor: '#3b82f6' } : {}}
        >
          {isDirty ? '💾 Guardar cambios' : '✓ Guardado'}
        </button>
      </div>

      <div className={styles.canvasArea}>
        {/* Paleta lateral */}
        <div className={styles.canvasSidebar}>
          <div className={styles.sidebarTitle}>Agregar nodo</div>
          {PALETTE.map((p) => (
            <button
              key={p.type}
              className={styles.paletteItem}
              onClick={() => handleAddNode(p.type)}
            >
              <span className={styles.paletteIcon}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Canvas React Flow */}
        <div className={styles.canvasFlow}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null}
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} color="#334155" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'ingredient') return '#166534';
                if (n.type === 'machine') return '#78350f';
                if (n.type === 'utensil') return '#3730a3';
                if (n.type === 'resultado') return '#7c3aed';
                return '#334155';
              }}
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            />
          </ReactFlow>

          {/* Panel de propiedades */}
          {selectedNode && (
            <NodePropsPanel
              node={selectedNode}
              insumos={insumos}
              onSave={handleNodePropsSave}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
