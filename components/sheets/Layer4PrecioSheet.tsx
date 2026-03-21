'use client';

import EditableCell from '@/components/ui/EditableCell';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Precio } from '@/types/layer4-precios';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function Layer4PrecioSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updatePrecio = useProjectStore((s) => s.updatePrecio);
  const addPrecio = useProjectStore((s) => s.addPrecio);
  const removePrecio = useProjectStore((s) => s.removePrecio);

  if (!project) return null;

  const precios = project.layers.layer4;
  const productos = project.layers.layer3;

  function getProductoName(productoId: string): string {
    return productos.find((p) => p.id === productoId)?.name ?? '—';
  }

  function handleAdd() {
    const firstProducto = productos[0];
    if (!firstProducto) return;
    const newItem: Precio = {
      id: crypto.randomUUID(),
      productoId: firstProducto.id,
      margenPorcentaje: 30,
      precioVenta: 0,
      roi: 0,
    };
    addPrecio(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Margen %</th>
            <th>Precio de venta</th>
            <th>ROI</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {precios.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                {productos.length === 0
                  ? 'Agrega productos en Capa 3 primero'
                  : 'Sin precios. Agrega el primero ↓'}
              </td>
            </tr>
          )}
          {precios.map((precio) => (
            <tr key={precio.id}>
              <td>
                <span style={{ fontWeight: 500 }}>{getProductoName(precio.productoId)}</span>
              </td>
              <td>
                <EditableCell
                  value={precio.margenPorcentaje}
                  type="percent"
                  onSave={(v) => updatePrecio(precio.id, { margenPorcentaje: v as number }, token)}
                />
              </td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(precio.precioVenta)}</span>
              </td>
              <td>
                <span
                  className={styles.calcCell}
                  style={{ color: precio.roi >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {formatPercent(precio.roi)}
                </span>
              </td>
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => removePrecio(precio.id, token)}
                  title="Eliminar precio"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.addRow}>
        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={productos.length === 0}
          title={productos.length === 0 ? 'Agrega productos primero' : undefined}
        >
          + Agregar precio
        </button>
      </div>
    </div>
  );
}
