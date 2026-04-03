'use client';

import styles from '../Layer1.module.css';

interface UtensilioFieldsProps {
  acquisitionCost: number;
  usefulLifeMonths: number;
  residualValue: number;
  onChange: (fields: {
    acquisitionCost?: number;
    usefulLifeMonths?: number;
    residualValue?: number;
    isReusable?: boolean;
  }) => void;
}

export default function UtensilioFields({
  acquisitionCost,
  usefulLifeMonths,
  residualValue,
  onChange,
}: UtensilioFieldsProps) {
  return (
    <>
      <div className={styles.formField}>
        <label htmlFor="ut-acquisition">Costo de adquisición ($)</label>
        <input
          id="ut-acquisition"
          type="number"
          min={0}
          step={1}
          value={acquisitionCost / 100}
          onChange={(e) =>
            onChange({ acquisitionCost: Math.round((parseFloat(e.target.value) || 0) * 100), isReusable: true })
          }
          placeholder="ej: 500"
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="ut-life">Vida útil (meses)</label>
        <input
          id="ut-life"
          type="number"
          min={1}
          step={1}
          value={usefulLifeMonths}
          onChange={(e) => onChange({ usefulLifeMonths: parseInt(e.target.value) || 1, isReusable: true })}
          placeholder="ej: 24"
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="ut-residual">Valor residual ($)</label>
        <input
          id="ut-residual"
          type="number"
          min={0}
          step={1}
          value={residualValue / 100}
          onChange={(e) =>
            onChange({ residualValue: Math.round((parseFloat(e.target.value) || 0) * 100), isReusable: true })
          }
          placeholder="ej: 0"
        />
      </div>
    </>
  );
}
