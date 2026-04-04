'use client';

import { useState, useEffect } from 'react';
import type { Edge } from '@xyflow/react';
import type { EdgeData } from '@/types/layer2-productos';
import styles from './NodeEditor.module.css';

interface Props {
  edge: Edge;
  onSave: (edgeId: string, data: EdgeData) => void;
  onClose: () => void;
}

export default function EdgePropsPanel({ edge, onSave, onClose }: Props) {
  const edgeData = (edge.data ?? {}) as EdgeData;

  const [quantityUsed, setQuantityUsed] = useState<string>(
    edgeData.quantityUsed != null ? String(edgeData.quantityUsed) : ''
  );
  const [unit, setUnit] = useState<string>(edgeData.unit ?? '');
  const [timeUsed, setTimeUsed] = useState<string>(
    edgeData.timeUsed != null ? String(edgeData.timeUsed) : ''
  );

  // Sync when selected edge changes
  useEffect(() => {
    const d = (edge.data ?? {}) as EdgeData;
    setQuantityUsed(d.quantityUsed != null ? String(d.quantityUsed) : '');
    setUnit(d.unit ?? '');
    setTimeUsed(d.timeUsed != null ? String(d.timeUsed) : '');
  }, [edge.id]);

  function handleSave() {
    const data: EdgeData = {};
    if (quantityUsed !== '') data.quantityUsed = parseFloat(quantityUsed) || 0;
    if (unit.trim() !== '') data.unit = unit.trim();
    if (timeUsed !== '') data.timeUsed = parseFloat(timeUsed) || 0;
    onSave(edge.id, data);
  }

  return (
    <div className={styles.propPanel} style={{ top: 52 }}>
      <div className={styles.propPanelTitle}>
        🔗 Conexión
        <button className={styles.propPanelClose} onClick={onClose} title="Cerrar">✕</button>
      </div>

      <div className={styles.sectionTitle}>📦 Datos de la conexión</div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Cantidad utilizada</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          step={0.001}
          value={quantityUsed}
          placeholder="Ej: 2.5"
          onChange={(e) => setQuantityUsed(e.target.value)}
        />
        <span className={styles.formHint}>Cantidad que fluye por esta conexión</span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Unidad</label>
        <input
          className={styles.formInput}
          type="text"
          value={unit}
          placeholder="Ej: kg, pza, ml"
          onChange={(e) => setUnit(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tiempo de uso (min)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          step={1}
          value={timeUsed}
          placeholder="Ej: 30"
          onChange={(e) => setTimeUsed(e.target.value)}
        />
        <span className={styles.formHint}>Opcional — tiempo que esta conexión está activa</span>
      </div>

      <button className={styles.propPanelSave} onClick={handleSave}>
        ✓ Guardar
      </button>
    </div>
  );
}
