'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UtensilNodeData } from '@/types/layer2-productos';
import styles from '../NodeEditor.module.css';

export default function UtensilNode({ data, selected }: NodeProps) {
  const d = data as unknown as UtensilNodeData;
  return (
    <div className={`${styles.node} ${styles.nodeUtensil} ${selected ? styles.nodeSelected : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>🔧</span>
        <span className={styles.nodeType}>Utensilio</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{d.insumoName || 'Sin nombre'}</div>
        <div className={styles.nodeMeta}>
          {d.unitsProducedThisMonth ?? 0} uds/mes
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
