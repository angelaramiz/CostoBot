'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { IngredientNodeData } from '@/types/layer2-productos';
import { formatCurrency } from '@/lib/format';
import styles from '../NodeEditor.module.css';

export default function IngredientNode({ data, selected }: NodeProps) {
  const d = data as unknown as IngredientNodeData;
  return (
    <div className={`${styles.node} ${styles.nodeIngredient} ${selected ? styles.nodeSelected : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>🌿</span>
        <span className={styles.nodeType}>Insumo</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{d.insumoName || 'Sin nombre'}</div>
        <div className={styles.nodeMeta}>
          {d.quantity} {d.unit}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
