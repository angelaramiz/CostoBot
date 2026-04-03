'use client';

import styles from '../Layer1.module.css';

interface MaquinaFieldsProps {
  acquisitionCost: number;
  usefulLifeMonths: number;
  onChange: (fields: {
    acquisitionCost?: number;
    usefulLifeMonths?: number;
    isReusable?: boolean;
  }) => void;
}

export default function MaquinaFields({
  acquisitionCost,
  usefulLifeMonths,
  onChange,
}: MaquinaFieldsProps) {
  return (
    <>
      <div className={styles.formField}>
        <label htmlFor="maq-acquisition">Costo de adquisición ($)</label>
        <input
          id="maq-acquisition"
          type="number"
          min={0}
          step={1}
          value={acquisitionCost / 100}
          onChange={(e) =>
            onChange({ acquisitionCost: Math.round((parseFloat(e.target.value) || 0) * 100), isReusable: true })
          }
          placeholder="ej: 2000"
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="maq-life">Vida útil (meses)</label>
        <input
          id="maq-life"
          type="number"
          min={1}
          step={1}
          value={usefulLifeMonths}
          onChange={(e) => onChange({ usefulLifeMonths: parseInt(e.target.value) || 1, isReusable: true })}
          placeholder="ej: 60"
        />
      </div>
    </>
  );
}
