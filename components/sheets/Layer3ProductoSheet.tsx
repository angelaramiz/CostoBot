'use client';

import EditableCell from '@/components/ui/EditableCell';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { ProductPricing } from '@/types/layer3-precios';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function Layer3ProductoSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateProductPricing = useProjectStore((s) => s.updateProductPricing);
  const addProductPricing = useProjectStore((s) => s.addProductPricing);
  const removeProductPricing = useProjectStore((s) => s.removeProductPricing);

  if (!project) return null;

  const products = project.layers.layer3.products;
  const graphs = project.layers.layer2;

  function handleAdd() {
    const firstGraph = graphs[0];
    if (!firstGraph) return;
    const newItem: ProductPricing = {
      productId: firstGraph.productId,
      productName: firstGraph.productName,
      costBreakdown: {
        ingredients: 0,
        machines: 0,
        utensils: 0,
        services: 0,
        labor: 0,
        totalCost: 0,
      },
      margenPorcentaje: 30,
      precioVenta: 0,
      roi: 0,
    };
    addProductPricing(newItem, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Costo total</th>
            <th>Margen %</th>
            <th>Precio de venta</th>
            <th>ROI</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyState}>
                {graphs.length === 0
                  ? 'Agrega grafos de producto en Capa 2 primero'
                  : 'Sin precios. Agrega el primero ↓'}
              </td>
            </tr>
          )}
          {products.map((pricing) => (
            <tr key={pricing.productId}>
              <td style={{ fontWeight: 500 }}>{pricing.productName}</td>
              <td>
                <span className={styles.calcCell}>
                  {formatCurrency(pricing.costBreakdown.totalCost)}
                </span>
              </td>
              <td>
                <EditableCell
                  value={pricing.margenPorcentaje}
                  type="percent"
                  onSave={(v) =>
                    updateProductPricing(pricing.productId, { margenPorcentaje: v as number }, token)
                  }
                />
              </td>
              <td>
                <span className={styles.calcCell}>{formatCurrency(pricing.precioVenta)}</span>
              </td>
              <td>
                <span
                  className={styles.calcCell}
                  style={{ color: pricing.roi >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {formatPercent(pricing.roi)}
                </span>
              </td>
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeProductPricing(pricing.productId, token)}
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
          disabled={graphs.length === 0}
          title={graphs.length === 0 ? 'Agrega grafos de producto primero' : undefined}
        >
          + Agregar precio
        </button>
      </div>
    </div>
  );
}
