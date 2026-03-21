'use client';

import EditableCell from '@/components/ui/EditableCell';
import TagSelector from '@/components/ui/TagSelector';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import type { Producto, ProductType } from '@/types/layer3-productos';
import { formatCurrency } from '@/lib/format';

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  fabricado: '🏭 Fabricado',
  retail: '🛍 Reventa',
  servicio: '🎯 Servicio',
};

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
      productType: 'fabricado',
      procesoIds: [],
      costoCompra: 0,
      costoUnitario: 0,
    };
    addProducto(newItem, token);
  }

  function handleTypeChange(id: string, nextType: ProductType) {
    updateProducto(id, { productType: nextType }, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Insumos / Costo base</th>
            <th>Costo unitario</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyState}>
                Sin productos. Agrega el primero ↓
              </td>
            </tr>
          )}
          {productos.map((producto) => {
            const type: ProductType = producto.productType ?? 'fabricado';
            const isFabricado = type === 'fabricado';
            return (
              <tr key={producto.id}>
                {/* Nombre */}
                <td>
                  <EditableCell
                    value={producto.name}
                    type="text"
                    placeholder="Nombre"
                    onSave={(v) => updateProducto(producto.id, { name: String(v) }, token)}
                  />
                </td>

                {/* Selector de tipo */}
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
                      <button
                        key={t}
                        title={PRODUCT_TYPE_LABELS[t]}
                        onClick={() => handleTypeChange(producto.id, t)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          border: '1px solid',
                          cursor: 'pointer',
                          borderColor: type === t ? '#6366f1' : '#d1d5db',
                          background: type === t ? '#eef2ff' : '#fff',
                          color: type === t ? '#4338ca' : '#6b7280',
                          fontWeight: type === t ? 600 : 400,
                        }}
                      >
                        {PRODUCT_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </td>

                {/* Procesos (fabricado) ó Costo de compra (retail/servicio) */}
                <td>
                  {isFabricado ? (
                    <TagSelector
                      selected={producto.procesoIds}
                      options={procesoOptions}
                      placeholder="Sin procesos"
                      onChange={(ids) => updateProducto(producto.id, { procesoIds: ids }, token)}
                    />
                  ) : (
                    <EditableCell
                      value={producto.costoCompra ?? 0}
                      type="number"
                      placeholder="Costo base (centavos)"
                      onSave={(v) =>
                        updateProducto(producto.id, { costoCompra: Number(v) }, token)
                      }
                    />
                  )}
                </td>

                {/* Costo unitario calculado */}
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
            );
          })}
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
