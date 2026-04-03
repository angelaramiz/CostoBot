'use client';

import type { InsumoCategory } from '@/types/layer1-insumos';
import styles from './Layer1.module.css';

interface CategoryBadgeProps {
  category: InsumoCategory;
}

const LABELS: Record<InsumoCategory, string> = {
  ingrediente: 'Ingrediente',
  material: 'Material',
  utensilio: 'Utensilio',
  maquina: 'Máquina',
};

const BADGE_CLASS: Record<InsumoCategory, string> = {
  ingrediente: styles['badge--ingrediente'],
  material: styles['badge--material'],
  utensilio: styles['badge--utensilio'],
  maquina: styles['badge--maquina'],
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className={`${styles.badge} ${BADGE_CLASS[category] ?? ''}`}>
      {LABELS[category] ?? category}
    </span>
  );
}
