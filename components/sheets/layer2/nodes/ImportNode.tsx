'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ImportNodeData } from '@/types/layer2-productos';
import styles from '../NodeEditor.module.css';

export default function ImportNode({ data, selected }: NodeProps) {
  const d = data as unknown as ImportNodeData;
  return (
    <div className={`${styles.node} ${styles.nodeImport} ${selected ? styles.nodeSelected : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>📥</span>
        <span className={styles.nodeType}>Importar</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{d.sourceProductName || 'Producto'}</div>
        <div className={styles.nodeMeta}>
          {d.quantity} {d.unit}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
