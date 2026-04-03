'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { MachineNodeData } from '@/types/layer2-productos';
import styles from '../NodeEditor.module.css';

export default function MachineNode({ data, selected }: NodeProps) {
  const d = data as unknown as MachineNodeData;
  return (
    <div className={`${styles.node} ${styles.nodeMachine} ${selected ? styles.nodeSelected : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>⚙️</span>
        <span className={styles.nodeType}>Máquina</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodeLabel}>{d.insumoName || 'Sin nombre'}</div>
        <div className={styles.nodeMeta}>
          {d.timeMinutes} min
          {d.temperature != null ? ` · ${d.temperature}°${d.temperatureUnit ?? 'C'}` : ''}
        </div>
        {d.serviceType && (
          <div className={styles.nodeMeta}>
            {d.serviceType === 'electricity' && '⚡ Electricidad'}
            {d.serviceType === 'gas' && '🔥 Gas'}
            {d.serviceType === 'both' && '⚡🔥 Ambos'}
            {d.serviceType === 'electricity' && d.powerKw != null ? ` · ${d.powerKw} kW` : ''}
            {d.serviceType === 'gas' && d.gasM3PerHour != null ? ` · ${d.gasM3PerHour} m³/h` : ''}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
