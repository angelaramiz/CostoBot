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
import ExportNode from './nodes/ExportNode';
import ImportNode from './nodes/ImportNode';
import NodePropsPanel from './NodePropsPanel';
import type { ProductGraph, ProductNode, ProductEdge } from '@/types/layer2-productos';
import type { Insumo } from '@/types/layer1-insumos';
import styles from './NodeEditor.module.css';

const NODE_TYPES = {
  ingredient: IngredientNode,
  machine: MachineNode,
  utensil: UtensilNode,
  resultado: ResultadoNode,
  export: ExportNode,
  import: ImportNode,
};

const PALETTE = [
  { type: 'ingredient', label: 'Insumo', icon: '🌿' },
  { type: 'utensil', label: 'Utensilio', icon: '🔧' },
  { type: 'machine', label: 'Máquina', icon: '⚙️' },
  { type: 'resultado', label: 'Resultado', icon: '🎯' },
  { type: 'export', label: 'Exportar', icon: '📤' },
  { type: 'import', label: 'Importar', icon: '📥' },
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
  // Intencionalmente no incluimos graph.nodes/edges para evitar re-desincronización
  useEffect(() => {
    setNodes(toFlowNodes(graph.nodes));
    setEdges(toFlowEdges(graph.edges));
    setSelectedNode(null);
    setIsDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Validación: no permitir conexiones de un nodo a sí mismo
    if (conn.source === conn.target) {
      console.warn('❌ No se puede conectar un nodo a sí mismo');
      return;
    }

    // Validación: solo permitir conexiones válidas
    const sourceNode = nodes.find((n) => n.id === conn.source);
    const targetNode = nodes.find((n) => n.id === conn.target);
    
    if (!sourceNode || !targetNode) {
      console.warn('❌ Nodo no existe');
      return;
    }

    // Regla: Flujo en cascada hacia transformación
    // - ingrediente/utensilio → máquina (entradas a concentrador)
    // - máquina → resultado (transformación)
    // - ingrediente/utensilio → resultado (directo si no necesita máquina)
    // - resultado → export (para marcar como reutilizable)
    // - import → resultado (usar producto reutilizable)
    const validConnections = [
      // Entradas a máquina (concentrador)
      ['ingredient', 'machine'],
      ['utensil', 'machine'],
      // Entradas a utensilio (ingrediente puede alimentar utensilio)
      ['ingredient', 'utensil'],
      ['machine', 'utensil'],
      // Import puede alimentar máquina y utensilio
      ['import', 'machine'],
      ['import', 'utensil'],
      // Salidas de máquina
      ['machine', 'resultado'],
      // Directas al resultado (alternativa)
      ['ingredient', 'resultado'],
      ['utensil', 'resultado'],
      // Export/Import
      ['resultado', 'export'],
      ['import', 'resultado'],
    ];

    const isValid = validConnections.some(
      ([src, tgt]) => sourceNode.type === src && targetNode.type === tgt
    );

    if (!isValid) {
      console.warn(`❌ No se puede conectar ${sourceNode.type} → ${targetNode.type}`);
      return; // Silenciosamente rechazar conexión inválida
    }

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
  }, [nodes]);

  const handleAddNode = useCallback((type: typeof PALETTE[number]['type']) => {
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
  }, [graph.productName]);

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

  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  function handleCanvasDoubleClick(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShowNodeMenu(true);
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
        <div className={styles.canvasFlow} onDoubleClick={handleCanvasDoubleClick}>
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

          {/* Menú de doble-clic para agregar nodos */}
          {showNodeMenu && (
            <div
              style={{
                position: 'absolute',
                left: menuPos.x,
                top: menuPos.y,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                boxShadow: '0 8px 32px #0008',
                zIndex: 20,
                minWidth: 160,
              }}
              onMouseLeave={() => setShowNodeMenu(false)}
            >
              {PALETTE.map((p) => (
                <button
                  key={p.type}
                  onClick={() => {
                    const id = crypto.randomUUID();
                    const newNode: Node = {
                      id,
                      type: p.type,
                      position: { x: menuPos.x - 80, y: menuPos.y - 40 },
                      data: {} as Record<string, unknown>,
                    };

                    if (p.type === 'ingredient') newNode.data = { insumoId: '', insumoName: 'Nuevo insumo', quantity: 1, unit: 'pza' };
                    if (p.type === 'machine') newNode.data = { insumoId: '', insumoName: 'Nueva máquina', timeMinutes: 10, temperature: undefined, temperatureUnit: 'C' };
                    if (p.type === 'utensil') newNode.data = { insumoId: '', insumoName: 'Nuevo utensilio', unitsProducedThisMonth: 1 };
                    if (p.type === 'resultado') newNode.data = {
                      mainProduct: { name: graph.productName, expectedQuantity: 1, unit: 'pza' },
                      inputTotal: 0,
                      yield: 1,
                    };
                    if (p.type === 'export') newNode.data = { exportedProductId: graph.productId, exportedProductName: graph.productName, isReusable: true };
                    if (p.type === 'import') newNode.data = { sourceProductId: '', sourceProductName: 'Producto', quantity: 1, unit: 'pza' };

                    setNodes((prev) => [...prev, newNode]);
                    setShowNodeMenu(false);
                    setIsDirty(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: '0.82rem',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#0f172a';
                    (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'none';
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          )}

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
