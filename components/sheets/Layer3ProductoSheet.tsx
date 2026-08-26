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

  const [expandedSection, setExpandedSection] = useState<'services' | 'fixed' | 'extra' | 'taxes' | 'products'>('products');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState('');
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxCountry, setNewTaxCountry] = useState('MX');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  if (!project) return null;

  const products = project.layers.layer3.products;
  const services = project.layers.layer3.services ?? {};
  const taxes = project.layers.layer3.taxes ?? {};
  const fixedCosts = project.layers.layer3.fixedCosts ?? {};
  const extraCosts = project.layers.layer3.extraCosts ?? {};
  const graphs = project.layers.layer2;

  function updateFixedCosts(field: 'renta' | 'serviciosFijos' | 'sueldosFijos' | 'otrosFijos' | 'unidadesMes', rawValue: string) {
    if (!project) return;
    const parsed = parseFloat(rawValue);
    const value = field === 'unidadesMes' ? (isNaN(parsed) ? 0 : Math.round(parsed)) : isNaN(parsed) ? 0 : Math.round(parsed * 100);
    const updatedProject = {
      ...project,
      layers: {
        ...project.layers,
        layer3: {
          ...project.layers.layer3,
          fixedCosts: { ...fixedCosts, [field]: value },
        },
      },
    };
    updateProjectData(updatedProject as typeof project, token);
  }

  function updateExtraCosts(field: 'laborCost' | 'packagingShipping' | 'other', rawValue: string) {
    if (!project) return;
    const parsed = parseFloat(rawValue);
    const cents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
    const updatedProject = {
      ...project,
      layers: {
        ...project.layers,
        layer3: {
          ...project.layers.layer3,
          extraCosts: { ...extraCosts, [field]: cents },
        },
      },
    };
    updateProjectData(updatedProject as typeof project, token);
  }

  function handleAddProduct() {
    if (!graphs || graphs.length === 0) return;
    const existingProductIds = new Set(products.map(p => p.productId));
    const graphsToAdd = graphs.filter(g => !existingProductIds.has(g.productId));
    graphsToAdd.forEach((graph) => {
      const newItem: ProductPricing = {
        productId: graph.productId,
        productName: graph.productName,
        costBreakdown: {
          ingredients: 0,
          machines: 0,
          utensils: 0,
          services: 0,
          labor: 0,
          packaging: 0,
          fixed: 0,
          totalCost: 0,
        },
        margenPorcentaje: 30,
        precioVenta: 0,
        ganancia: 0,
      };
      addProductPricing(newItem, token);
    });
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
    const numRate = parseFloat(newTaxRate);
    const rate = numRate >= 1 ? numRate / 100 : numRate;
    const updatedTaxes = {
      ...taxes,
      [keyName]: {
        rate: rate,
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

  const sectionHeaderStyle: React.CSSProperties = {
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
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#e2e8f0',
    fontSize: '0.82rem',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    color: '#64748b',
    display: 'block',
    marginBottom: 4,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div className={styles.sheetWrapper} style={{ padding: 0, flexDirection: 'column', gap: 0 }}>

      {/* SECCION 1: SERVICIOS */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'services' ? 'products' : 'services')}
          style={sectionHeaderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'services' ? 'v' : '>'}</span>
          Servicios (Electricidad, Agua, Gas)
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
                  <tr><td colSpan={5} className={styles.emptyState}>Sin servicios configurados</td></tr>
                )}
                {Object.entries(services).map(([key, service]) => (
                  <tr key={key}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key}</td>
                    <td><span className={styles.calcCell}>{formatCurrency(service?.baseRate ?? 0)}</span></td>
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
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Eliminar servicio"
                      >x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="Nombre del servicio" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={inputStyle} />
              <input type="number" step="0.01" placeholder="Tarifa (en moneda)" value={newServiceRate} onChange={(e) => setNewServiceRate(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Unidad (kWh, m3, etc)" value={newServiceUnit} onChange={(e) => setNewServiceUnit(e.target.value)} style={inputStyle} />
              <button onClick={handleAddService} style={{ padding: '6px 12px', background: '#2563eb', border: 'none', borderRadius: 5, color: '#fff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}>
                + Agregar
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              Agrega servicios como electricidad, agua, gas o cualquier otro costo variable
            </div>
          </div>
        )}
      </div>

      {/* SECCION 2: GASTOS FIJOS (mensuales) */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'fixed' ? 'products' : 'fixed')}
          style={sectionHeaderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'fixed' ? 'v' : '>'}</span>
          Gastos Fijos (mensuales)
        </button>
        {expandedSection === 'fixed' && (
          <div style={{ padding: '16px', background: '#0f172a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Renta / Alquiler</label>
                <input type="number" min={0} step={1} defaultValue={fixedCosts.renta != null ? (fixedCosts.renta / 100).toFixed(2) : ''} placeholder="0.00" onBlur={(e) => updateFixedCosts('renta', e.target.value)} style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>Alquiler del local por mes</div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Servicios fijos</label>
                <input type="number" min={0} step={1} defaultValue={fixedCosts.serviciosFijos != null ? (fixedCosts.serviciosFijos / 100).toFixed(2) : ''} placeholder="0.00" onBlur={(e) => updateFixedCosts('serviciosFijos', e.target.value)} style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>Luz base, agua, internet, telefono</div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Sueldos fijos</label>
                <input type="number" min={0} step={1} defaultValue={fixedCosts.sueldosFijos != null ? (fixedCosts.sueldosFijos / 100).toFixed(2) : ''} placeholder="0.00" onBlur={(e) => updateFixedCosts('sueldosFijos', e.target.value)} style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>Salarios que pagas aunque no vendas</div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Otros fijos</label>
                <input type="number" min={0} step={1} defaultValue={fixedCosts.otrosFijos != null ? (fixedCosts.otrosFijos / 100).toFixed(2) : ''} placeholder="0.00" onBlur={(e) => updateFixedCosts('otrosFijos', e.target.value)} style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>Seguros, contador, etc.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Unidades al mes</label>
                <input type="number" min={0} step={1} defaultValue={fixedCosts.unidadesMes != null ? String(fixedCosts.unidadesMes) : ''} placeholder="ej: 1000" onBlur={(e) => updateFixedCosts('unidadesMes', e.target.value)} style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginTop: 8 }} />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>Cuantás unidades produces al mes (para prorrateo)</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total fijos</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{formatCurrency((fixedCosts.renta ?? 0) + (fixedCosts.serviciosFijos ?? 0) + (fixedCosts.sueldosFijos ?? 0) + (fixedCosts.otrosFijos ?? 0))} / mes</div>
                {(fixedCosts.unidadesMes ?? 0) > 0 && ((fixedCosts.renta ?? 0)+(fixedCosts.serviciosFijos ?? 0)+(fixedCosts.sueldosFijos ?? 0)+(fixedCosts.otrosFijos ?? 0)) > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 4 }}>{formatCurrency(Math.round(((fixedCosts.renta ?? 0)+(fixedCosts.serviciosFijos ?? 0)+(fixedCosts.sueldosFijos ?? 0)+(fixedCosts.otrosFijos ?? 0)) / (fixedCosts.unidadesMes ?? 1)))} por unidad</div>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              Los gastos fijos se distribuyen proporcionalmente entre productos. Si pones unidades/mes, se prorratea por unidad exacta.
            </div>
          </div>
        )}
      </div>

      {/* SECCION 3: GASTOS AGREGADOS (por lote) */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'extra' ? 'products' : 'extra')}
          style={sectionHeaderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'extra' ? 'v' : '>'}</span>
          Gastos Agregados (por lote)
        </button>
        {expandedSection === 'extra' && (
          <div style={{ padding: '16px', background: '#0f172a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>

              {/* Mano de obra */}
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Mano de obra</label>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={extraCosts.laborCost != null ? (extraCosts.laborCost / 100).toFixed(2) : ''}
                  placeholder="0.00"
                  onBlur={(e) => updateExtraCosts('laborCost', e.target.value)}
                  style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>
                  Costo total de mano de obra por lote
                </div>
                {extraCosts.laborCost != null && extraCosts.laborCost > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 4, fontWeight: 500 }}>
                    {formatCurrency(extraCosts.laborCost)}
                  </div>
                )}
              </div>

              {/* Empaque/Envio */}
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Empaque / Envio</label>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={extraCosts.packagingShipping != null ? (extraCosts.packagingShipping / 100).toFixed(2) : ''}
                  placeholder="0.00"
                  onBlur={(e) => updateExtraCosts('packagingShipping', e.target.value)}
                  style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>
                  Materiales de empaque o costos de envio
                </div>
                {extraCosts.packagingShipping != null && extraCosts.packagingShipping > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 4, fontWeight: 500 }}>
                    {formatCurrency(extraCosts.packagingShipping)}
                  </div>
                )}
              </div>

              {/* Otros gastos */}
              <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 14px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Otros gastos</label>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={extraCosts.other != null ? (extraCosts.other / 100).toFixed(2) : ''}
                  placeholder="0.00"
                  onBlur={(e) => updateExtraCosts('other', e.target.value)}
                  style={{ ...inputStyle, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>
                  Gastos adicionales no categorizados
                </div>
                {extraCosts.other != null && extraCosts.other > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 4, fontWeight: 500 }}>
                    {formatCurrency(extraCosts.other)}
                  </div>
                )}
              </div>
            </div>

            {/* Total Gastos Agregados (por lote) */}
            {((extraCosts.laborCost ?? 0) + (extraCosts.packagingShipping ?? 0) + (extraCosts.other ?? 0)) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginRight: 8 }}>Total gastos extra:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>
                  {formatCurrency((extraCosts.laborCost ?? 0) + (extraCosts.packagingShipping ?? 0) + (extraCosts.other ?? 0))}
                </span>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 12, fontStyle: 'italic' }}>
              Los gastos extra se distribuyen entre los productos para refinar el costo final
            </div>
          </div>
        )}
      </div>

      {/* SECCION 4: IMPUESTOS */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'taxes' ? 'products' : 'taxes')}
          style={sectionHeaderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'taxes' ? 'v' : '>'}</span>
          Impuestos (IVA, Retenciones)
        </button>
        {expandedSection === 'taxes' && (
          <div style={{ padding: '12px 16px', background: '#0f172a' }}>
            <table className={styles.table} style={{ marginBottom: 8 }}>
              <thead>
                <tr>
                  <th>Tipo impuesto</th>
                  <th>Tasa %</th>
                  <th>Pais</th>
                  <th>Estado</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(taxes).length === 0 && (
                  <tr><td colSpan={5} className={styles.emptyState}>Sin impuestos configurados</td></tr>
                )}
                {Object.entries(taxes).map(([key, tax]) => (
                  <tr key={key}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key}</td>
                    <td><span className={styles.calcCell}>{formatPercent(tax?.rate ?? 0)}</span></td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{tax?.country ?? 'MX'}</td>
                    <td><span style={{ fontSize: '0.78rem', color: tax?.enabled ? '#16a34a' : '#ef4444' }}>{tax?.enabled ? 'Activo' : 'Inactivo'}</span></td>
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
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Eliminar impuesto"
                      >x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="Tipo de impuesto (IVA, Retencion, etc)" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)} style={inputStyle} />
              <input type="text" inputMode="decimal" placeholder="Tasa % (ej: 16 o 0.16)" value={newTaxRate} onChange={(e) => setNewTaxRate(e.target.value)} style={inputStyle} />
              <select value={newTaxCountry} onChange={(e) => setNewTaxCountry(e.target.value)} style={inputStyle}>
                <option value="MX">Mexico</option>
                <option value="CO">Colombia</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="PE">Peru</option>
                <option value="ES">Espana</option>
                <option value="US">USA</option>
                <option value="OTHER">Otro</option>
              </select>
              <button onClick={handleAddTax} style={{ padding: '6px 12px', background: '#2563eb', border: 'none', borderRadius: 5, color: '#fff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}>
                + Agregar
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              Configura impuestos segun tu pais y tipo de empresa
            </div>
          </div>
        )}
      </div>

      {/* SECCION 5: PRODUCTOS (Costos y Precios) */}
      <div style={{ borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setExpandedSection(expandedSection === 'products' ? 'services' : 'products')}
          style={sectionHeaderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          <span>{expandedSection === 'products' ? 'v' : '>'}</span>
          Productos (Costos y Precios)
        </button>
        {expandedSection === 'products' && (
          <div style={{ padding: '16px', background: '#0f172a' }}>
            {products.length === 0 && (
              <div className={styles.emptyState} style={{ padding: '32px 16px' }}>
                {graphs.length === 0 ? 'Agrega grafos de producto en Capa 2 primero' : 'Sin precios. Agrega el primero'}
              </div>
            )}

            {/* TARJETAS DE PRODUCTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
              {products.map((pricing) => {
                const isExpanded = expandedProduct === pricing.productId;
                const hasImpuestos = pricing.precioVentaConImpuestos != null && pricing.precioVentaConImpuestos > 0;
                const precioFinal = hasImpuestos ? pricing.precioVentaConImpuestos! : pricing.precioVenta;
                const gananciaPositiva = pricing.ganancia >= 0;

                return (
                  <div key={pricing.productId} style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>

                    {/* CABECERA DE TARJETA */}
                    <div
                      onClick={() => setExpandedProduct(isExpanded ? null : pricing.productId)}
                      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pricing.productName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                            Margen {pricing.margenPorcentaje.toFixed(1)}% &middot; ROI {pricing.roi != null ? `${pricing.roi.toFixed(1)}%` : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Precio final destacado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                            {hasImpuestos ? 'Precio c/IVA' : 'Precio venta'}
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8', lineHeight: 1 }}>
                            {formatCurrency(precioFinal)}
                          </div>
                          {hasImpuestos && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                              sin IVA: {formatCurrency(pricing.precioVenta)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: gananciaPositiva ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                              color: gananciaPositiva ? '#16a34a' : '#dc2626',
                              border: `1px solid ${gananciaPositiva ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
                            }}
                          >
                            {gananciaPositiva ? '+' : '-'} {formatCurrency(Math.abs(pricing.ganancia))}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeProductPricing(pricing.productId, token); }}
                            className={styles.deleteBtn}
                            title="Eliminar precio"
                          >x</button>
                          <span style={{ color: '#475569', fontSize: '0.8rem' }}>{isExpanded ? '^' : 'v'}</span>
                        </div>
                      </div>
                    </div>

                    {/* DETALLE EXPANDIDO */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #334155', padding: '16px' }}>

                        {/* Fila 1: Metricas clave */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                          {[
                            { label: 'Costo por lote', value: formatCurrency(pricing.costBreakdown.totalCost), color: '#f1f5f9' },
                            { label: 'Margen %', value: null, isEditable: true },
                            { label: 'Precio de venta', value: formatCurrency(pricing.precioVenta), color: '#818cf8' },
                            { label: 'Precio c/Impuestos', value: hasImpuestos ? formatCurrency(pricing.precioVentaConImpuestos!) : '-', color: '#38bdf8', highlight: true },
                          ].map((item, i) => (
                            <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px', border: item.highlight ? '1px solid #38bdf8' : '1px solid #1e293b' }}>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{item.label}</div>
                              {item.isEditable ? (
                                <EditableCell
                                  value={pricing.margenPorcentaje}
                                  type="percent"
                                  onSave={(v) => updateProductPricing(pricing.productId, { margenPorcentaje: v as number }, token)}
                                />
                              ) : (
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: item.color ?? '#f1f5f9' }}>{item.value}</div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Fila 2: Desglose de costos */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
                            Desglose del costo
                          </div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {[
                              { label: 'Ingredientes', value: pricing.costBreakdown.ingredients },
                              { label: 'Máquinas', value: pricing.costBreakdown.machines },
                              { label: 'Utensilios', value: pricing.costBreakdown.utensils },
                              { label: 'Servicios (variables)', value: pricing.costBreakdown.services },
                              { label: 'Empaque', value: pricing.costBreakdown.packaging ?? 0 },
                              { label: 'Mano de obra', value: pricing.costBreakdown.labor },
                              { label: 'Gastos fijos', value: pricing.costBreakdown.fixed ?? 0 },
                            ]
                              .filter(item => item.value > 0)
                              .map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '6px 10px', borderRadius: 6 }}>
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.label}</span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{formatCurrency(item.value)}</span>
                                </div>
                              ))
                            }
                          </div>
                        </div>

                        {/* Fila 3: ROI + Ganancia */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', padding: '8px 14px', borderRadius: 8 }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ROI</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                              {pricing.roi != null ? `${pricing.roi.toFixed(1)}%` : '-'}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: gananciaPositiva ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                            padding: '8px 14px', borderRadius: 8,
                            border: `1px solid ${gananciaPositiva ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
                          }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ganancia</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: gananciaPositiva ? '#16a34a' : '#dc2626' }}>
                              {formatCurrency(pricing.ganancia)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Boton agregar */}
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