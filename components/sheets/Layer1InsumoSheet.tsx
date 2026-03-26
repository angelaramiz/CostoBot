'use client';

import EditableCell from '@/components/ui/EditableCell';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Insumo } from '@/types/layer1-insumos';
import { formatCurrency } from '@/lib/format';

const UNITS = ['kg', 'g', 'L', 'ml', 'pza', 'm', 'cm', 'hr', 'otro'];
const CATEGORIES = ['ingrediente', 'maquina', 'utensilio'];

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
      category: 'ingrediente',
      isReusable: false,
    };
    addInsumo(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Unidad</th>
            <th>Costo / unidad</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                Sin insumos. Agrega el primero ↓
              </td>
            </tr>
          )}
          {insumos.map((insumo) => {
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
                    value={insumo.category}
                    type="select"
                    selectOptions={CATEGORIES}
                    onSave={(v) => updateInsumo(insumo.id, { category: String(v) as any }, token)}
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
                  <button
                    className={styles.deleteBtn}
                    onClick={() => removeInsumo(insumo.id, token)}
                    title="Eliminar insumo"
                    aria-label={`Eliminar insumo ${insumo.name}`}
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

      {/* ── Depreciación para máquinas/utensilios ─────────────────── */}
      <div style={{ padding: '16px 12px', background: '#0f172a', marginTop: 8, borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12, fontWeight: 600 }}>
          💡 Estimador de depreciación (máquinas/utensilios)
        </div>
        {insumos
          .filter((i) => i.category === 'maquina' || i.category === 'utensilio')
          .filter((i) => i.acquisitionCost != null && i.usefulLifeMonths != null)
          .map((insumo) => {
            const monthlyDep =
              ((insumo.acquisitionCost ?? 0) - (insumo.residualValue ?? 0)) /
              (insumo.usefulLifeMonths ?? 1);
            const costPerUnit = insumo.quantity > 0 ? monthlyDep / insumo.quantity : 0;
            return (
              <div key={insumo.id} style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                <strong>{insumo.name}</strong> ({insumo.category}):
                <br />
                <span style={{ color: '#94a3b8' }}>
                  Depr. mensual: {formatCurrency(monthlyDep)} | Costo/unidad: {formatCurrency(costPerUnit)}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
