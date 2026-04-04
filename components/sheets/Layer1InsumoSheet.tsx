'use client';

import { useState } from 'react';
import EditableCell from '@/components/ui/EditableCell';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Insumo, InsumoCategory } from '@/types/layer1-insumos';
import { formatCurrency } from '@/lib/format';
import CategorySelector from './layer1/CategorySelector';
import CategoryBadge from './layer1/CategoryBadge';
import InsumoAddForm from './layer1/InsumoAddForm';

const UNITS = ['kg', 'g', 'L', 'ml', 'pza', 'm', 'cm', 'hr', 'otro'];
const CATEGORIES: InsumoCategory[] = ['ingrediente', 'material', 'utensilio', 'maquina'];

export default function Layer1InsumoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateInsumo = useProjectStore((s) => s.updateInsumo);
  const addInsumo = useProjectStore((s) => s.addInsumo);
  const removeInsumo = useProjectStore((s) => s.removeInsumo);

  const [activeCategory, setActiveCategory] = useState<InsumoCategory | 'all'>('all');

  if (!project) return null;

  const allInsumos = Array.isArray(project.layers.layer1) ? project.layers.layer1 : [];

  const counts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = allInsumos.filter((i) => i.category === cat).length;
      return acc;
    },
    {} as Record<InsumoCategory, number>
  );

  const visibleInsumos =
    activeCategory === 'all'
      ? allInsumos
      : allInsumos.filter((i) => i.category === activeCategory);

  const showBadge = activeCategory === 'all';

  function handleAdd(newInsumo: Insumo) {
    addInsumo(newInsumo, token);
  }

  return (
    <div>
      <CategorySelector
        counts={counts}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className={styles.sheetWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              {showBadge && <th>Categoría</th>}
              <th>Unidad</th>
              <th>Costo / unidad</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {visibleInsumos.length === 0 && (
              <tr>
                <td colSpan={showBadge ? 5 : 4} className={styles.emptyState}>
                  Sin insumos en esta categoría. Agrega el primero ↓
                </td>
              </tr>
            )}
            {visibleInsumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>
                  <EditableCell
                    value={insumo.name}
                    type="text"
                    placeholder="Nombre"
                    onSave={(v) => updateInsumo(insumo.id, { name: String(v) }, token)}
                  />
                </td>
                {showBadge && (
                  <td>
                    <CategoryBadge category={insumo.category} />
                  </td>
                )}
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
            ))}
          </tbody>
        </table>
      </div>

      <InsumoAddForm counts={counts} onAdd={handleAdd} />

      <div className={styles.infoBox}>
        <strong>Fórmulas de costo:</strong> Ingredientes y materiales: costo × cantidad.
        Utensilios y máquinas: (valor adquisición − residual) ÷ vida útil en meses.
        Los costos de uso (tiempo por receta) se definen en Capa 2 — Productos.
      </div>
    </div>
  );
}