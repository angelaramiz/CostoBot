'use client';

import EditableCell from '@/components/shared/EditableCell';
import styles from '@/components/shared/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Insumo } from '@/types/layer1-insumos';
import { formatCurrency } from '@/lib/format';

const UNITS = ['kg', 'g', 'L', 'ml', 'pza', 'm', 'cm', 'hr', 'otro'];

export default function Layer1InsumoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateInsumo = useProjectStore((s) => s.updateInsumo);
  const addInsumo = useProjectStore((s) => s.addInsumo);
  const removeInsumo = useProjectStore((s) => s.removeInsumo);

  if (!project) return null;

  const insumos = project.layers.layer1;

  function handleAdd() {
    const newItem: Insumo = {
      id: crypto.randomUUID(),
      name: 'Nuevo insumo',
      unit: 'pza',
      costPerUnit: 0,
      quantity: 1,
    };
    addInsumo(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Costo / unidad</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyState}>
                Sin insumos. Agrega el primero ↓
              </td>
            </tr>
          )}
          {insumos.map((insumo) => {
            const subtotal = Math.round(insumo.costPerUnit * insumo.quantity);
            return (
              <tr key={insumo.id}>
                <td>
                  <EditableCell
                    value={insumo.name}
                    type="text"
                    placeholder="Nombre"
                    onSave={(v) => updateInsumo(insumo.id, { name: String(v) }, token)}
                  />
                </td>
                <td>
                  <EditableCell
                    value={insumo.unit}
                    type="select"
                    selectOptions={UNITS}
                    onSave={(v) => updateInsumo(insumo.id, { unit: String(v) }, token)}
                  />
                </td>
                <td>
                  <EditableCell
                    value={insumo.costPerUnit}
                    type="currency"
                    onSave={(v) => updateInsumo(insumo.id, { costPerUnit: v as number }, token)}
                  />
                </td>
                <td>
                  <EditableCell
                    value={insumo.quantity}
                    type="number"
                    onSave={(v) => updateInsumo(insumo.id, { quantity: v as number }, token)}
                  />
                </td>
                <td>
                  <span className={styles.calcCell}>{formatCurrency(subtotal)}</span>
                </td>
                <td>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => removeInsumo(insumo.id, token)}
                    title="Eliminar insumo"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={handleAdd}>
          + Agregar insumo
        </button>
      </div>
    </div>
  );
}
