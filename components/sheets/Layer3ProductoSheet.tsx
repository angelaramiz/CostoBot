'use client';

import { useState } from 'react';
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

  const [expandedSection, setExpandedSection] = useState<'services' | 'taxes' | 'extra' | 'products'>('products');

  if (!project) return null;

  const products = project.layers.layer3.products;
  const services = project.layers.layer3.services ?? {};
  const taxes = project.layers.layer3.taxes ?? {};
  const graphs = project.layers.layer2;

  function handleAddProduct() {
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
    <div className={styles.sheetWrapper} style={{ padding: 0, flexDirection: 'column', gap: 0 }}>
      {/* ── SECCIÓN 1: SERVICIOS ────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'services' ? 'products' : 'services')}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1e293b',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e2e8f0',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'services' ? '▼' : '▶'}</span>
          ⚡ Servicios (Electricidad, Agua, Gas)
        </button>
        {expandedSection === 'services' && (
          <div style={{ padding: '12px 16px', background: '#0f172a' }}>
            <table className={styles.table} style={{ marginBottom: 8 }}>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Tarifa base</th>
                  <th>Unidad</th>
                  <th>Moneda</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(services).length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      Sin servicios configurados
                    </td>
                  </tr>
                )}
                {Object.entries(services).map(([key, service]) => (
                  <tr key={key}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key}</td>
                    <td>
                      <span className={styles.calcCell}>{formatCurrency(service?.baseRate ?? 0)}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{service?.unit}</td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{service?.currency ?? 'MXN'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              💡 Configurar servicios en la ventana de ajustes o con el agente IA
            </div>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: IMPUESTOS ────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'taxes' ? 'products' : 'taxes')}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1e293b',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e2e8f0',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'taxes' ? '▼' : '▶'}</span>
          📋 Impuestos (IVA, Retenciones)
        </button>
        {expandedSection === 'taxes' && (
          <div style={{ padding: '12px 16px', background: '#0f172a' }}>
            <table className={styles.table} style={{ marginBottom: 8 }}>
              <thead>
                <tr>
                  <th>Tipo impuesto</th>
                  <th>Tasa %</th>
                  <th>País</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(taxes).length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      Sin impuestos configurados
                    </td>
                  </tr>
                )}
                {Object.entries(taxes).map(([key, tax]) => (
                  <tr key={key}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key}</td>
                    <td>
                      <span className={styles.calcCell}>{formatPercent(tax?.rate ?? 0)}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{tax?.country ?? 'MX'}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: tax?.enabled ? '#16a34a' : '#ef4444' }}>
                        {tax?.enabled ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              💡 Configurar impuestos según tu país/región
            </div>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 3: MONTOS EXTRA ─────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'extra' ? 'products' : 'extra')}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1e293b',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e2e8f0',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'extra' ? '▼' : '▶'}</span>
          💰 Gastos Extra
        </button>
        {expandedSection === 'extra' && (
          <div style={{ padding: '12px 16px', background: '#0f172a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                  Empaque/Envío
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="Monto en centavos"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 5,
                    color: '#e2e8f0',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                  Otros gastos
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="Monto en centavos"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 5,
                    color: '#e2e8f0',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>
              💡 Gastos adicionales globales que serán distribuidos entre todos los productos
            </div>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 4: TABLA DE PRODUCTOS ───────────────────────── */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'products' ? 'services' : 'products')}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1e293b',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e2e8f0',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'products' ? '▼' : '▶'}</span>
          📊 Productos (Costos y Precios)
        </button>
        {expandedSection === 'products' && (
          <div style={{ padding: 0 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Costo/unidad</th>
                  <th>Margen %</th>
                  <th>Precio de venta</th>
                  <th>ROI %</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      {graphs.length === 0 ? 'Agrega grafos de producto en Capa 2 primero' : 'Sin precios. Agrega el primero ↓'}
                    </td>
                  </tr>
                )}
                {products.map((pricing) => (
                  <tr key={pricing.productId}>
                    <td style={{ fontWeight: 500 }}>{pricing.productName}</td>
                    <td>
                      <span className={styles.calcCell}>{formatCurrency(pricing.costBreakdown.totalCost)}</span>
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
                onClick={handleAddProduct}
                disabled={graphs.length === 0}
                title={graphs.length === 0 ? 'Agrega grafos de producto primero' : undefined}
              >
                + Agregar precio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
