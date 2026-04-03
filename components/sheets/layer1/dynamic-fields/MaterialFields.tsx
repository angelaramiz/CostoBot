'use client';

import styles from '../Layer1.module.css';

interface MaterialFieldsProps {
  quantity: number;
  supplier: string;
  sku: string;
  onChange: (fields: { quantity?: number; supplier?: string; sku?: string }) => void;
}

export default function MaterialFields({ quantity, supplier, sku, onChange }: MaterialFieldsProps) {
  return (
    <>
      <div className={styles.formField}>
        <label htmlFor="mat-quantity">Cantidad</label>
        <input
          id="mat-quantity"
          type="number"
          min={0}
          step={0.01}
          value={quantity}
          onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
          placeholder="ej: 2"
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="mat-supplier">Proveedor (opcional)</label>
        <input
          id="mat-supplier"
          type="text"
          value={supplier}
          onChange={(e) => onChange({ supplier: e.target.value })}
          placeholder="ej: Distribuidora XYZ"
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="mat-sku">SKU (opcional)</label>
        <input
          id="mat-sku"
          type="text"
          value={sku}
          onChange={(e) => onChange({ sku: e.target.value })}
          placeholder="ej: MAT-001"
        />
      </div>
    </>
  );
}
