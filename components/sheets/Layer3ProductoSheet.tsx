'use client';

import EditableCell from '@/components/shared/EditableCell';
import TagSelector from '@/components/shared/TagSelector';
import styles from '@/components/shared/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Producto } from '@/types/layer3-productos';
import { formatCurrency } from '@/lib/format';

export default function Layer3ProductoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateProducto = useProjectStore((s) => s.updateProducto);
  const addProducto = useProjectStore((s) => s.addProducto);
  const removeProducto = useProjectStore((s) => s.removeProducto);

  if (!project) return null;

  const productos = project.layers.layer3;
  const procesoOptions = project.layers.layer2.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  function handleAdd() {
    const newItem: Producto = {
      id: crypto.randomUUID(),
      name: 'Nuevo producto',
      procesoIds: [],
      costoUnitario: 0,
    };
    addProducto(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Procesos</th>
            <th>Costo unitario</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.emptyState}>
                Sin productos. Agrega el primero ↓
              </td>
            </tr>
          )}
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td>
                <EditableCell
                  value={producto.name}
                  type="text"
                  placeholder="Nombre"
                  onSave={(v) => updateProducto(producto.id, { name: String(v) }, token)}
                />
              </td>
              <td>
                <TagSelector
                  selected={producto.procesoIds}
                  options={procesoOptions}
                  placeholder="Sin procesos"
                  onChange={(ids) => updateProducto(producto.id, { procesoIds: ids }, token)}
                />
              </td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(producto.costoUnitario)}</span>
              </td>
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeProducto(producto.id, token)}
                  title="Eliminar producto"
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
          + Agregar producto
        </button>
      </div>
    </div>
  );
}
