'use client';

import { useState } from 'react';
import type { Insumo, InsumoCategory } from '@/types/layer1-insumos';
import CategorySelector from './CategorySelector';
import IngredienteFields from './dynamic-fields/IngredienteFields';
import MaterialFields from './dynamic-fields/MaterialFields';
import UtensilioFields from './dynamic-fields/UtensilioFields';
import MaquinaFields from './dynamic-fields/MaquinaFields';
import styles from './Layer1.module.css';

const UNITS = ['kg', 'g', 'L', 'ml', 'pza', 'm', 'cm', 'hr', 'otro'];

type FormState = {
  name: string;
  unit: string;
  costPerUnit: number; // en pesos (se convierte a centavos al guardar)
  category: InsumoCategory;
  quantity: number;
  isReusable: boolean;
  acquisitionCost: number; // centavos
  usefulLifeMonths: number;
  residualValue: number; // centavos
  supplier: string;
  sku: string;
};

const defaultForm: FormState = {
  name: '',
  unit: 'pza',
  costPerUnit: 0,
  category: 'ingrediente',
  quantity: 1,
  isReusable: false,
  acquisitionCost: 0,
  usefulLifeMonths: 12,
  residualValue: 0,
  supplier: '',
  sku: '',
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
    patch({
      category: cat,
      isReusable: cat === 'maquina' || cat === 'utensilio',
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
      quantity: form.quantity,
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
              onChange={(e) => patch({ unit: e.target.value })}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="add-cost">Costo / unidad ($)</label>
            <input
              id="add-cost"
              type="number"
              min={0}
              step={0.01}
              value={form.costPerUnit}
              onChange={(e) => patch({ costPerUnit: parseFloat(e.target.value) || 0 })}
              placeholder="ej: 12.50"
            />
          </div>
        </div>

        {/* Campos dinámicos por categoría */}
        <div className={styles.formRow}>
          {form.category === 'ingrediente' && (
            <IngredienteFields
              quantity={form.quantity}
              onChange={(quantity) => patch({ quantity })}
            />
          )}

          {form.category === 'material' && (
            <MaterialFields
              quantity={form.quantity}
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
