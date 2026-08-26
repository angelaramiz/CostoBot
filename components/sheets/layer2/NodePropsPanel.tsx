'use client';

import { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type {
  NodeType,
  ProductGraph,
  IngredientNodeData,
  MachineNodeData,
  UtensilNodeData,
  ResultadoNodeData,
  ExportNodeData,
  ImportNodeData,
} from '@/types/layer2-productos';
import type { Insumo } from '@/types/layer1-insumos';
import type { ServicesConfig } from '@/types/layer3-precios';
import { getUnitGroup } from '@/lib/units';
import styles from './NodeEditor.module.css';

interface Props {
  node: Node;
  allGraphs: ProductGraph[];
  insumos: Insumo[];
  services?: ServicesConfig;
  onSave: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

/** Panel lateral de propiedades al seleccionar un nodo */
export default function NodePropsPanel({ node, allGraphs, insumos, services, onSave, onClose }: Props) {
  const nodeType = node.type as NodeType;
  const [form, setForm] = useState<Record<string, unknown>>({ ...node.data as Record<string, unknown> });

  useEffect(() => {
    setForm({ ...node.data as Record<string, unknown> });
    // Intencionalmente no incluimos node.data en dependencias para evitar re-render excesivo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(node.id, form);
  }

  const ingredientInsumos = insumos.filter((i) => i.category === 'ingrediente');
  const machineInsumos = insumos.filter((i) => i.category === 'maquina');
  const utensilInsumos = insumos.filter((i) => i.category === 'utensilio');
  const materialInsumos = insumos.filter((i) => i.category === 'material');

  return (
    <div className={styles.propPanel}>
      <div className={styles.propPanelTitle}>
        {nodeType === 'ingredient' && '🌿 Insumo'}
        {nodeType === 'machine' && '⚙️ Máquina'}
        {nodeType === 'utensil' && '🔧 Utensilio'}
        {nodeType === 'resultado' && '🎯 Resultado'}
        <button className={styles.propPanelClose} onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      {/* ── Ingredient ─────────────────────────────────────────────── */}
      {nodeType === 'ingredient' && (() => {
        const selectedInsumo = insumos.find((i) => i.id === (form.insumoId as string));
        const insumoUnit = selectedInsumo?.unit ?? 'pza';
        const group = getUnitGroup(insumoUnit);
        // Unidades compatibles dentro del mismo grupo físico
        const UNIT_OPTIONS: Record<string, string[]> = {
          weight: ['mg', 'g', 'kg'],
          volume: ['ml', 'L'],
          count: ['pza'],
          length: ['mm', 'cm', 'm'],
          time: ['min', 'hr'],
        };
        const compatibleUnits = group ? UNIT_OPTIONS[group] ?? [insumoUnit] : [insumoUnit];
        const currentUnit = (form.unit as string) || insumoUnit;

        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Insumo (Layer 1)</label>
              <select
                className={styles.formSelect}
                value={String(form.insumoId ?? '')}
                onChange={(e) => {
                  const insumo = insumos.find((i) => i.id === e.target.value);
                  set('insumoId', e.target.value);
                  set('insumoName', insumo?.name ?? '');
                  set('unit', insumo?.unit ?? 'pza');
                }}
              >
                <option value="">— Selecciona —</option>
                {ingredientInsumos.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className={styles.formInput}
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.quantity ? String(form.quantity) : ''}
                  placeholder="0"
                  onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
                  style={{ flex: 1 }}
                />
                <select
                  className={styles.formSelect}
                  value={currentUnit}
                  onChange={(e) => set('unit', e.target.value)}
                  style={{ width: 90, flexShrink: 0 }}
                  title={selectedInsumo ? `Insumo en ${insumoUnit} — conversión automática` : undefined}
                >
                  {compatibleUnits.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              {selectedInsumo && currentUnit !== insumoUnit && (
                <span className={styles.formHint}>
                  Conversión automática: {String(form.quantity || 0)} {currentUnit} → {insumoUnit} para cálculo preciso
                </span>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Machine ────────────────────────────────────────────────── */}
      {nodeType === 'machine' && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Máquina (Layer 1)</label>
            <select
              className={styles.formSelect}
              value={String(form.insumoId ?? '')}
              onChange={(e) => {
                const insumo = insumos.find((i) => i.id === e.target.value);
                set('insumoId', e.target.value);
                set('insumoName', insumo?.name ?? '');
              }}
            >
              <option value="">— Selecciona —</option>
              {machineInsumos.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tiempo de uso (minutos)</label>
            <input
              className={styles.formInput}
              type="number"
              min={0}
              step={1}
              value={form.timeMinutes ? String(form.timeMinutes) : ''}
              placeholder="0"
              onChange={(e) => set('timeMinutes', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Temperatura</label>
            <input
              className={styles.formInput}
              type="number"
              step={1}
              value={String(form.temperature ?? '')}
              placeholder="Opcional"
              onChange={(e) => set('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unidad de temperatura</label>
            <select
              className={styles.formSelect}
              value={String(form.temperatureUnit ?? 'C')}
              onChange={(e) => set('temperatureUnit', e.target.value)}
            >
              <option value="C">°C (Celsius)</option>
              <option value="F">°F (Fahrenheit)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tipo de servicio</label>
            <select
              className={styles.formSelect}
              value={String(form.serviceType ?? '')}
              onChange={(e) => set('serviceType', e.target.value || undefined)}
            >
              <option value="">— No especificado —</option>
              <option value="electricity">⚡ Electricidad</option>
              <option value="gas">🔥 Gas</option>
              <option value="both">⚡🔥 Ambos</option>
            </select>
          </div>
          {(form.serviceType === 'electricity' || form.serviceType === 'both') && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Potencia (kW)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.1}
                value={String(form.powerKw ?? '')}
                placeholder="ej: 1.5"
                onChange={(e) => set('powerKw', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          )}
          {(form.serviceType === 'gas' || form.serviceType === 'both') && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Consumo de gas (m³/hora)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.01}
                value={String(form.gasM3PerHour ?? '')}
                placeholder="ej: 0.5"
                onChange={(e) => set('gasM3PerHour', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          )}
        </>
      )}

      {/* ── Utensil ─────────────────────────────────────────────────── */}
      {nodeType === 'utensil' && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Utensilio (Layer 1)</label>
            <select
              className={styles.formSelect}
              value={String(form.insumoId ?? '')}
              onChange={(e) => {
                const insumo = insumos.find((i) => i.id === e.target.value);
                set('insumoId', e.target.value);
                set('insumoName', insumo?.name ?? '');
              }}
            >
              <option value="">— Selecciona —</option>
              {utensilInsumos.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unidades producidas este mes</label>
            <input
              className={styles.formInput}
              type="number"
              min={1}
              step={1}
              value={form.unitsProducedThisMonth ? String(form.unitsProducedThisMonth) : ''}
              placeholder="1"
              onChange={(e) => set('unitsProducedThisMonth', parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </>
      )}

      {/* ── Resultado ─────────────────────────────────────────────── */}
      {nodeType === 'resultado' && (() => {
        const resultadoData = form as unknown as ResultadoNodeData;
        const mainProd = resultadoData.mainProduct ?? { name: '', expectedQuantity: 0, unit: '' };
        const byProd = resultadoData.byProduct;

        return (
          <>
            {/* Producto Principal */}
            <div className={styles.sectionTitle}>📦 Producto Principal</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre del producto</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(mainProd.name ?? '')}
                onChange={(e) =>
                  set('mainProduct', {
                    ...mainProd,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad esperada de salida</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.01}
                value={mainProd.expectedQuantity ? String(mainProd.expectedQuantity) : ''}
                placeholder="0"
                onChange={(e) =>
                  set('mainProduct', {
                    ...mainProd,
                    expectedQuantity: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unidad de salida</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(mainProd.unit ?? '')}
                onChange={(e) =>
                  set('mainProduct', {
                    ...mainProd,
                    unit: e.target.value,
                  })
                }
              />
            </div>

            {/* Sub-producto (Byproduct) */}
            <div className={styles.sectionTitle}>🔄 Sub-producto (Opcional)</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  checked={!!byProd}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('byProduct', {
                        name: '',
                        expectedQuantity: 0,
                        unit: '',
                        canBeIngredient: false,
                        globalIngredientId: undefined,
                      });
                    } else {
                      set('byProduct', undefined);
                    }
                  }}
                />
                {' '}
                Usar sub-producto
              </label>
            </div>

            {byProd && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre del sub-producto</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={String(byProd.name ?? '')}
                    onChange={(e) =>
                      set('byProduct', {
                        ...byProd,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cantidad esperada</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0}
                    step={0.01}
                    value={byProd.expectedQuantity ? String(byProd.expectedQuantity) : ''}
                    placeholder="0"
                    onChange={(e) =>
                      set('byProduct', {
                        ...byProd,
                        expectedQuantity: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unidad</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={String(byProd.unit ?? '')}
                    onChange={(e) =>
                      set('byProduct', {
                        ...byProd,
                        unit: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <input
                      type="checkbox"
                      checked={!!byProd.canBeIngredient}
                      onChange={(e) =>
                        set('byProduct', {
                          ...byProd,
                          canBeIngredient: e.target.checked,
                        })
                      }
                    />
                    {' '}
                    Registrable como insumo en Layer 1
                  </label>
                </div>
              </>
            )}

            {/* Rendimiento */}
            <div className={styles.sectionTitle}>📊 Rendimiento</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Total de entrada (suma ingredientes)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.01}
                value={resultadoData.inputTotal ? String(resultadoData.inputTotal) : ''}
                placeholder="0"
                onChange={(e) => set('inputTotal', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rendimiento (0-1)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={resultadoData.yield ? String(resultadoData.yield) : ''}
                placeholder="0.8"
                onChange={(e) => set('yield', parseFloat(e.target.value) || 0)}
              />
              <span className={styles.formHint}>Ej: 0.80 = 80% de rendimiento</span>
            </div>

            {/* Empaque */}
            <div className={styles.sectionTitle}>🫙 Empaque (Envase)</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Material de empaque (Layer 1)</label>
              <select
                className={styles.formSelect}
                value={String(resultadoData.packagingMaterialId ?? '')}
                onChange={(e) => {
                  const mat = materialInsumos.find((m) => m.id === e.target.value);
                  set('packagingMaterialId', e.target.value || undefined);
                  set('packagingMaterialName', mat?.name ?? undefined);
                  if (!e.target.value) {
                    set('packagingCapacity', undefined);
                  }
                }}
              >
                <option value="">— Sin empaque —</option>
                {materialInsumos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
              {materialInsumos.length === 0 && (
                <span className={styles.formHint}>
                  No hay materiales en Layer 1. Agrega frascos, botellas o cajas primero.
                </span>
              )}
            </div>

            {resultadoData.packagingMaterialId && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Capacidad del envase ({mainProd.unit})
                  </label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={resultadoData.packagingCapacity ? String(resultadoData.packagingCapacity) : ''}
                    placeholder={`ej: 0.5 (${mainProd.unit})`}
                    onChange={(e) =>
                      set('packagingCapacity', parseFloat(e.target.value) || undefined)
                    }
                  />
                  <span className={styles.formHint}>
                    Cuánto producto cabe en cada envase (en {mainProd.unit})
                  </span>
                </div>

                {(resultadoData.packagingCapacity ?? 0) > 0 &&
                  mainProd.expectedQuantity > 0 && (() => {
                    const units = Math.floor(
                      mainProd.expectedQuantity / (resultadoData.packagingCapacity!)
                    );
                    return (
                      <div className={styles.formGroup}>
                        <div
                          style={{
                            background: 'var(--color-primary, #22c55e)',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          📦 {units} {units === 1 ? 'unidad' : 'unidades'} de{' '}
                          {resultadoData.packagingCapacity} {mainProd.unit} cada una
                        </div>
                        <span className={styles.formHint}>
                          Lote: {mainProd.expectedQuantity} {mainProd.unit} ÷{' '}
                          {resultadoData.packagingCapacity} {mainProd.unit}/envase ={' '}
                          {units} {resultadoData.packagingMaterialName ?? 'envases'}
                        </span>
                      </div>
                    );
                  })()}
              </>
            )}

            {/* Consumo de Servicios */}
            {services && Object.keys(services).length > 0 && (
              <>
                <div className={styles.sectionTitle}>⚡ Consumo de Servicios</div>
                {Object.entries(services).map(([key, rate]) => {
                  if (!rate) return null;
                  const currentUsage = resultadoData.servicesUsage?.[key] ?? 0;
                  return (
                    <div key={key} className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({rate.unit})
                      </label>
                      <input
                        className={styles.formInput}
                        type="number"
                        min={0}
                        step={0.01}
                        value={String(currentUsage || '')}
                        placeholder={`ej: 2.5 ${rate.unit}`}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const current = (form.servicesUsage as Record<string, number>) ?? {};
                          set('servicesUsage', { ...current, [key]: val });
                        }}
                      />
                      <span className={styles.formHint}>
                        Tarifa: {(rate.baseRate / 100).toFixed(2)} {rate.currency}/{rate.unit}
                      </span>
                    </div>
                  );
                })}
                <div className={styles.formHint} style={{ marginBottom: 8, fontStyle: 'italic' }}>
                  💡 Consumo total por lote (no por unidad)
                </div>
              </>
            )}
          </>
        );
      })()}

      {/* ── Export ────────────────────────────────────────────────── */}
      {nodeType === 'export' && (() => {
        const exportData = form as unknown as ExportNodeData;
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ID del producto exportado</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(exportData.exportedProductId ?? '')}
                onChange={(e) => set('exportedProductId', e.target.value)}
              />
              <span className={styles.formHint}>Define el ID para reutilizar en otros productos</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre del producto</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(exportData.exportedProductName ?? '')}
                onChange={(e) => set('exportedProductName', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  checked={!!exportData.isReusable}
                  onChange={(e) => set('isReusable', e.target.checked)}
                />
                {' '}
                Reutilizable en otros productos
              </label>
            </div>
          </>
        );
      })()}

      {/* ── Import ────────────────────────────────────────────────── */}
      {nodeType === 'import' && (() => {
        const importData = form as unknown as ImportNodeData;
        // Filtrar: no mostrar el producto actual en la lista de importables
        const otherGraphs = allGraphs.filter((g) => {
          // const currentGraph = allGraphs.find((gr) => ...); // Podríamos validar esto mejor
          return true; // Por ahora mostrar todos
        });
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Producto a importar</label>
              <select
                className={styles.formInput}
                value={String(importData.sourceProductId ?? '')}
                onChange={(e) => {
                  const selected = otherGraphs.find((g) => g.productId === e.target.value);
                  if (selected) {
                    set('sourceProductId', selected.productId);
                    set('sourceProductName', selected.productName);
                  }
                }}
                style={{
                  padding: '6px 8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <option value="">-- Seleccionar producto --</option>
                {otherGraphs.map((g) => (
                  <option key={g.productId} value={g.productId}>
                    {g.productName}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ID del producto</label>
              <span style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all' }}>
                {importData.sourceProductId || '(sin seleccionar)'}
              </span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad usada</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.01}
                value={importData.quantity ? String(importData.quantity) : ''}
                placeholder="0"
                onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unidad</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(importData.unit ?? 'pza')}
                onChange={(e) => set('unit', e.target.value)}
              />
            </div>
          </>
        );
      })()}

      <button className={styles.propPanelSave} onClick={handleSave}>
        Guardar cambios
      </button>
    </div>
  );
}
