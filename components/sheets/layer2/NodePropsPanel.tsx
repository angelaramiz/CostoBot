'use client';

import { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type {
  NodeType,
  IngredientNodeData,
  MachineNodeData,
  UtensilNodeData,
  ResultadoNodeData,
  ExportNodeData,
  ImportNodeData,
} from '@/types/layer2-productos';
import type { Insumo } from '@/types/layer1-insumos';
import styles from './NodeEditor.module.css';

interface Props {
  node: Node;
  insumos: Insumo[];
  onSave: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

/** Panel lateral de propiedades al seleccionar un nodo */
export default function NodePropsPanel({ node, insumos, onSave, onClose }: Props) {
  const nodeType = node.type as NodeType;
  const [form, setForm] = useState<Record<string, unknown>>({ ...node.data as Record<string, unknown> });

  useEffect(() => {
    setForm({ ...node.data as Record<string, unknown> });
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
      {nodeType === 'ingredient' && (
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
                set('unit', form.unit ?? insumo?.unit ?? 'pza');
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
            <input
              className={styles.formInput}
              type="number"
              min={0}
              step={0.01}
              value={String(form.quantity ?? 0)}
              onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unidad</label>
            <input
              className={styles.formInput}
              type="text"
              value={String(form.unit ?? '')}
              onChange={(e) => set('unit', e.target.value)}
            />
          </div>
        </>
      )}

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
              value={String(form.timeMinutes ?? 0)}
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
              value={String(form.unitsProducedThisMonth ?? 1)}
              onChange={(e) => set('unitsProducedThisMonth', parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </>
      )}

      {/* ── Resultado ─────────────────────────────────────────────── */}
      {nodeType === 'resultado' && (() => {
        const resultadoData = form as ResultadoNodeData;
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
                value={String(mainProd.expectedQuantity ?? 0)}
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
                    value={String(byProd.expectedQuantity ?? 0)}
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
                value={String(resultadoData.inputTotal ?? 0)}
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
                value={String(resultadoData.yield ?? 0.8)}
                onChange={(e) => set('yield', parseFloat(e.target.value) || 0)}
              />
              <span className={styles.formHint}>Ej: 0.80 = 80% de rendimiento</span>
            </div>
          </>
        );
      })()}

      {/* ── Export ────────────────────────────────────────────────── */}
      {nodeType === 'export' && (() => {
        const exportData = form as ExportNodeData;
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ID del producto exportado</label>
              <input
                className={styles.formInput}
                type="text"
                readOnly
                value={String(exportData.exportedProductId ?? '')}
              />
              <span className={styles.formHint}>Asignado automáticamente</span>
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
        const importData = form as ImportNodeData;
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Producto a importar (ID)</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(importData.sourceProductId ?? '')}
                onChange={(e) => set('sourceProductId', e.target.value)}
                placeholder="ID del producto exportado"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre del producto</label>
              <input
                className={styles.formInput}
                type="text"
                value={String(importData.sourceProductName ?? '')}
                onChange={(e) => set('sourceProductName', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad usada</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                step={0.01}
                value={String(importData.quantity ?? 0)}
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
