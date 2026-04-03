'use client';

import styles from '../Layer1.module.css';

interface MaterialFieldsProps {
  supplier: string;
  sku: string;
  onChange: (fields: { supplier?: string; sku?: string }) => void;
}

export default function MaterialFields({ supplier, sku, onChange }: MaterialFieldsProps) {
  return (
    <>
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
