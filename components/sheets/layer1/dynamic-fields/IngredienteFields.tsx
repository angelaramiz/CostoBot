'use client';

import styles from '../Layer1.module.css';

interface IngredienteFieldsProps {
  quantity: number;
  onChange: (quantity: number) => void;
}

export default function IngredienteFields({ quantity, onChange }: IngredienteFieldsProps) {
  return (
    <div className={styles.formField}>
      <label htmlFor="ing-quantity">Cantidad por receta</label>
      <input
        id="ing-quantity"
        type="number"
        min={0}
        step={0.01}
        value={quantity}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="ej: 0.5"
      />
    </div>
  );
}
