'use client';

import EditableCell from '@/components/shared/EditableCell';
import TagSelector from '@/components/shared/TagSelector';
import styles from '@/components/shared/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Proceso } from '@/types/layer2-procesos';
import { formatCurrency } from '@/lib/format';

export default function Layer2ProcesoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateProceso = useProjectStore((s) => s.updateProceso);
  const addProceso = useProjectStore((s) => s.addProceso);
  const removeProceso = useProjectStore((s) => s.removeProceso);

  if (!project) return null;

  const procesos = project.layers.layer2;
  const insumoOptions = project.layers.layer1.map((i) => ({
    id: i.id,
    label: i.name,
  }));

  function handleAdd() {
    const newItem: Proceso = {
      id: crypto.randomUUID(),
      name: 'Nuevo proceso',
      insumoIds: [],
      laborCost: 0,
      totalCost: 0,
    };
    addProceso(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Insumos</th>
            <th>Costo mano de obra</th>
            <th>Costo total</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {procesos.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                Sin procesos. Agrega el primero ↓
              </td>
            </tr>
          )}
          {procesos.map((proceso) => (
            <tr key={proceso.id}>
              <td>
                <EditableCell
                  value={proceso.name}
                  type="text"
                  placeholder="Nombre"
                  onSave={(v) => updateProceso(proceso.id, { name: String(v) }, token)}
                />
              </td>
              <td>
                <TagSelector
                  selected={proceso.insumoIds}
                  options={insumoOptions}
                  placeholder="Sin insumos"
                  onChange={(ids) => updateProceso(proceso.id, { insumoIds: ids }, token)}
                />
              </td>
              <td>
                <EditableCell
                  value={proceso.laborCost}
                  type="currency"
                  onSave={(v) => updateProceso(proceso.id, { laborCost: v as number }, token)}
                />
              </td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(proceso.totalCost)}</span>
              </td>
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeProceso(proceso.id, token)}
                  title="Eliminar proceso"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={handleAdd}>
          + Agregar proceso
        </button>
      </div>
    </div>
  );
}
