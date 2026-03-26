'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExportNodeData } from '@/types/layer2-productos';
import styles from '../NodeEditor.module.css';

export default function ExportNode({ data, selected }: NodeProps) {
  const d = data as unknown as ExportNodeData;
  return (
    <div className={`${styles.node} ${styles.nodeExport} ${selected ? styles.nodeSelected : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>📤</span>
        <span className={styles.nodeType}>Exportar</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{d.exportedProductName || 'Producto'}</div>
        <div className={styles.nodeMeta}>
          {d.isReusable ? '✓ Reutilizable' : '✗ Solo lectura'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
