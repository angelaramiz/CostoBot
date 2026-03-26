'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ResultadoNodeData } from '@/types/layer2-productos';
import { formatCurrency } from '@/lib/format';
import styles from '../NodeEditor.module.css';

export default function ResultadoNode({ data, selected }: NodeProps) {
  const d = data as unknown as ResultadoNodeData;
  const yieldPct = d.yield != null ? Math.round(d.yield * 100) : 0;
  return (
    <div className={`${styles.node} ${styles.nodeResultado} ${selected ? styles.nodeSelected : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>🎯</span>
        <span className={styles.nodeType}>Resultado</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>
          {d.mainProduct?.name ?? 'Producto'}
        </div>
        <div className={styles.nodeMeta}>
          Qty: {d.mainProduct?.expectedQuantity ?? 0} {d.mainProduct?.unit ?? ''}
        </div>
        <div className={styles.nodeMeta}>
          Rendimiento: {yieldPct}%
        </div>
        {d.byProduct && (
          <div className={styles.nodeMeta} style={{ color: '#a78bfa' }}>
            Sub: {d.byProduct.name} ({d.byProduct.expectedQuantity} {d.byProduct.unit})
          </div>
        )}
      </div>
    </div>
  );
}
