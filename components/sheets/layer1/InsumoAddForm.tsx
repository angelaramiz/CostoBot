'use client';

import { useState } from 'react';
import type { Insumo, InsumoCategory } from '@/types/layer1-insumos';
import CategorySelector from './CategorySelector';
import IngredienteFields from './dynamic-fields/IngredienteFields';
import MaterialFields from './dynamic-fields/MaterialFields';
import UtensilioFields from './dynamic-fields/UtensilioFields';
import MaquinaFields from './dynamic-fields/MaquinaFields';
import { getUnitsForCategory, getGroupedUnitsForCategory, getPackageInnerUnits } from '@/lib/units';
import styles from './Layer1.module.css';

type FormState = {
    name: string;
    unit: string;
    costPerUnit: number; // en pesos (se convierte a centavos al guardar)
    category: InsumoCategory;
    isReusable: boolean;
    acquisitionCost: number; // centavos
    usefulLifeMonths: number;
    residualValue: number; // centavos
    supplier: string;
    sku: string;
    packageQuantity: number;
    packageUnit: string;
};

const defaultForm: FormState = {
    name: '',
    unit: 'pza',
    costPerUnit: 0,
    category: 'ingrediente',
    isReusable: false,
    acquisitionCost: 0,
    usefulLifeMonths: 12,
    residualValue: 0,
    supplier: '',
    sku: '',
    packageQuantity: 0,
    packageUnit: 'pza',
};

interface InsumoAddFormProps {
    counts: Record<InsumoCategory, number>;
    onAdd: (insumo: Insumo) => void;
}

export default function InsumoAddForm({ counts, onAdd }: InsumoAddFormProps) {
    const [form, setForm] = useState<FormState>(defaultForm);

    function patch(fields: Partial<FormState>) {
        setForm((prev) => ({ ...prev, ...fields }));
    }

    function handleCategorySelect(cat: InsumoCategory | 'all') {
        if (cat === 'all') return;
        const allowed = getUnitsForCategory(cat);
        const nextUnit = allowed.includes(form.unit) ? form.unit : allowed[0];
        patch({
            category: cat,
            unit: nextUnit,
            isReusable: cat === 'maquina' || cat === 'utensilio',
            ...(cat === 'utensilio' ? { costPerUnit: 0 } : {}),
            ...(nextUnit !== 'paquete' ? { packageQuantity: 0, packageUnit: 'pza' } : {}),
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return;

        const newInsumo: Insumo = {
            id: crypto.randomUUID(),
            name: form.name.trim(),
            unit: form.unit,
            costPerUnit: Math.round(form.costPerUnit * 100),
            category: form.category,
            isReusable: form.isReusable,
            ...(form.category === 'maquina' || form.category === 'utensilio'
                ? {
                    acquisitionCost: form.acquisitionCost,
                    usefulLifeMonths: form.usefulLifeMonths,
                    residualValue: form.residualValue,
                }
                : {}),
            ...(form.category === 'material'
                ? {
                    supplier: form.supplier || undefined,
                    sku: form.sku || undefined,
                }
                : {}),
            ...(form.unit === 'paquete'
                ? {
                    packageQuantity: form.packageQuantity || 1,
                    packageUnit: form.packageUnit || 'pza',
                }
                : {}),
        };

        onAdd(newInsumo);
        setForm({ ...defaultForm, category: form.category, unit: form.unit });
    }

    // Conteos para el selector (excluye 'all')
    const selectorCounts = counts;

    return (
        <div className={styles.addFormWrapper}>
            <p className={styles.addFormTitle}>+ Agregar insumo</p>

            {/* Selector de categoría */}
            <CategorySelector
                counts={selectorCounts}
                active={form.category}
                onSelect={handleCategorySelect}
            />

            <form onSubmit={handleSubmit} noValidate>
                {/* Campos base */}
                <div className={styles.formRow}>
                    <div className={styles.formField}>
                        <label htmlFor="add-name">Nombre</label>
                        <input
                            id="add-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => patch({ name: e.target.value })}
                            placeholder="ej: Harina de trigo"
                            required
                        />
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="add-unit">Unidad</label>
                        <select
                            id="add-unit"
                            value={form.unit}
                            onChange={(e) => {
                                const next = e.target.value;
                                if (next === 'paquete') {
                                    const innerUnits = getPackageInnerUnits(form.category);
                                    patch({ unit: next, packageQuantity: form.packageQuantity || 1, packageUnit: form.packageUnit || innerUnits[0] || 'pza' });
                                } else {
                                    patch({ unit: next, packageQuantity: 0, packageUnit: 'pza' });
                                }
                            }}
                        >
                            {getGroupedUnitsForCategory(form.category).map(({ group, units }) => (
                                <optgroup key={group} label={group === 'weight' ? 'Peso' : group === 'volume' ? 'Volumen' : group === 'count' ? 'Cantidad' : 'Tiempo'}>
                                    {units.map((u) => (
                                        <option key={u} value={u}>
                                            {u === 'fl_oz' ? 'oz liq' : u}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {form.category !== 'utensilio' && (
                        <div className={styles.formField}>
                            <label htmlFor="add-cost">
                                {form.category === 'maquina' ? 'Tarifa por hora ($/hr)' : 'Costo / unidad ($)'}
                            </label>
                            <input
                                id="add-cost"
                                type="number"
                                min={0}
                                step={0.01}
                                value={form.costPerUnit || ''}
                                onChange={(e) => patch({ costPerUnit: parseFloat(e.target.value) || 0 })}
                                placeholder={form.category === 'maquina' ? 'ej: 50.00 /hr' : 'ej: 12.50'}
                                title={
                                    form.category === 'maquina'
                                        ? 'Usado solo si no configuras servicio (electricidad/gas) en Capa 2'
                                        : undefined
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Contenido del paquete — solo si unidad es paquete */}
                {form.unit === 'paquete' && (
                    <div className={styles.formRow} style={{ marginTop: 8, background: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: '8px 10px', border: '1px dashed #3b82f6' }}>
                        <div className={styles.formField}>
                            <label htmlFor="add-pkg-qty">Contenido por paquete</label>
                            <input
                                id="add-pkg-qty"
                                type="number"
                                min={0.001}
                                step={0.01}
                                value={form.packageQuantity || ''}
                                onChange={(e) => patch({ packageQuantity: parseFloat(e.target.value) || 0 })}
                                placeholder="ej: 4"
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ej: caja 20kg → 20, pack 4L → 4</span>
                        </div>
                        <div className={styles.formField}>
                            <label htmlFor="add-pkg-unit">Unidad interna</label>
                            <select
                                id="add-pkg-unit"
                                value={form.packageUnit}
                                onChange={(e) => patch({ packageUnit: e.target.value })}
                            >
                                {getPackageInnerUnits(form.category).map((u) => (
                                    <option key={u} value={u}>{u === 'fl_oz' ? 'oz liq' : u}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Qué hay dentro del paquete</span>
                        </div>
                        {form.packageQuantity > 0 && form.costPerUnit > 0 && (
                            <div className={styles.formField} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, paddingBottom: 6 }}>
                                    ${(form.costPerUnit / form.packageQuantity).toFixed(2)} / {form.packageUnit === 'fl_oz' ? 'oz liq' : form.packageUnit}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Campos dinámicos por categoría */}
                <div className={styles.formRow}>
                    {form.category === 'ingrediente' && (
                        <IngredienteFields />
                    )}

                    {form.category === 'material' && (
                        <MaterialFields
                            supplier={form.supplier}
                            sku={form.sku}
                            onChange={(fields) => patch(fields)}
                        />
                    )}

                    {form.category === 'utensilio' && (
                        <UtensilioFields
                            acquisitionCost={form.acquisitionCost}
                            usefulLifeMonths={form.usefulLifeMonths}
                            residualValue={form.residualValue}
                            onChange={(fields) => patch(fields)}
                        />
                    )}

                    {form.category === 'maquina' && (
                        <MaquinaFields
                            acquisitionCost={form.acquisitionCost}
                            usefulLifeMonths={form.usefulLifeMonths}
                            onChange={(fields) => patch(fields)}
                        />
                    )}

                    <button type="submit" className={styles.submitBtn} disabled={!form.name.trim()}>
                        Agregar
                    </button>
                </div>
            </form>
        </div>
    );
}
