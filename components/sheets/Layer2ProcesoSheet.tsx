'use client';

/**
 * Layer 2 — Editor de Grafos de Productos
 * Placeholder para la implementación con React Flow.
 * @see types/layer2-productos.ts
 */

import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { formatCurrency } from '@/lib/format';

/**
 * Placeholder para el editor de grafos de producto (Layer 2).
 * La implementación completa usará React Flow (@xyflow/react).
 * Por ahora muestra una tabla resumen de los grafos existentes.
 */
export default function Layer2ProcesoSheet() {
  const project = useProjectStore((s) => s.currentProject);

  if (!project) return null;

  const graphs = project.layers.layer2;

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Nodos</th>
            <th>Aristas</th>
            <th>Costo total</th>
            <th>Mano de obra</th>
          </tr>
        </thead>
        <tbody>
          {graphs.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                Sin grafos de producto. El editor visual estará disponible próximamente.
              </td>
            </tr>
          )}
          {graphs.map((graph) => (
            <tr key={graph.productId}>
              <td style={{ fontWeight: 500 }}>{graph.productName}</td>
              <td>{graph.nodes.length}</td>
              <td>{graph.edges.length}</td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(graph.totalCost)}</span>
              </td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(graph.laborCost)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.85rem' }}>
        🔧 El editor visual de nodos (React Flow) estará disponible próximamente.
      </p>
    </div>
  );
}
