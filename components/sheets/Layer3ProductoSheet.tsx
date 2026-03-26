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
  const updateProjectData = useProjectStore((s) => s.updateProjectData);
  const updateProductPricing = useProjectStore((s) => s.updateProductPricing);
  const addProductPricing = useProjectStore((s) => s.addProductPricing);
  const removeProductPricing = useProjectStore((s) => s.removeProductPricing);

  const [expandedSection, setExpandedSection] = useState<'services' | 'taxes' | 'extra' | 'products'>('products');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState('');
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxCountry, setNewTaxCountry] = useState('MX');

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

  function handleAddService() {
    if (!newServiceName || !newServiceRate || !newServiceUnit || !project) return;
    const keyName = newServiceName.toLowerCase().replace(/\s+/g, '_');
    const updatedServices = {
      ...services,
      [keyName]: {
        baseRate: Math.round(parseFloat(newServiceRate) * 100),
        unit: newServiceUnit,
        currency: project.settings?.currency ?? 'MXN',
      },
    };
    const updatedProject: typeof project = {
      ...project,
      layers: { ...project.layers, layer3: { ...project.layers.layer3, services: updatedServices } },
    };
    updateProjectData(updatedProject, token);
    setNewServiceName('');
    setNewServiceRate('');
    setNewServiceUnit('');
  }

  function handleAddTax() {
    if (!newTaxName || !newTaxRate || !project) return;
    const keyName = newTaxName.toLowerCase().replace(/\s+/g, '_');
    const updatedTaxes = {
      ...taxes,
      [keyName]: {
        rate: parseFloat(newTaxRate),
        enabled: true,
        country: newTaxCountry,
      },
    };
    const updatedProject: typeof project = {
      ...project,
      layers: { ...project.layers, layer3: { ...project.layers.layer3, taxes: updatedTaxes } },
    };
    updateProjectData(updatedProject, token);
    setNewTaxName('');
    setNewTaxRate('');
    setNewTaxCountry('MX');
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
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(services).length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>
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
                    <td>
                      <button
                        onClick={() => {
                          if (!project) return;
                          const updatedServices = { ...services };
                          delete updatedServices[key];
                          const updatedProject: typeof project = {
                            ...project,
                            layers: { ...project.layers, layer3: { ...project.layers.layer3, services: updatedServices } },
                          };
                          updateProjectData(updatedProject, token);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Eliminar servicio"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Nombre del servicio"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Tarifa (en moneda)"
                value={newServiceRate}
                onChange={(e) => setNewServiceRate(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              />
              <input
                type="text"
                placeholder="Unidad (kWh, m³, etc)"
                value={newServiceUnit}
                onChange={(e) => setNewServiceUnit(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              />
              <button
                onClick={handleAddService}
                style={{
                  padding: '6px 12px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: 5,
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                + Agregar
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              💡 Agrega servicios como electricidad, agua, gas o cualquier otro costo variable
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
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(taxes).length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>
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
                    <td>
                      <button
                        onClick={() => {
                          if (!project) return;
                          const updatedTaxes = { ...taxes };
                          delete updatedTaxes[key];
                          const updatedProject: typeof project = {
                            ...project,
                            layers: { ...project.layers, layer3: { ...project.layers.layer3, taxes: updatedTaxes } },
                          };
                          updateProjectData(updatedProject, token);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Eliminar impuesto"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Tipo de impuesto (IVA, Retención, etc)"
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Tasa % (ej: 16)"
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              />
              <select
                value={newTaxCountry}
                onChange={(e) => setNewTaxCountry(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <option value="MX">México</option>
                <option value="CO">Colombia</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="PE">Perú</option>
                <option value="ES">España</option>
                <option value="US">USA</option>
                <option value="OTHER">Otro</option>
              </select>
              <button
                onClick={handleAddTax}
                style={{
                  padding: '6px 12px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: 5,
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                + Agregar
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              💡 Configura impuestos según tu país y tipo de empresa
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
