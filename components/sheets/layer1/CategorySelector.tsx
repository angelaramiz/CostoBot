'use client';

import type { InsumoCategory } from '@/types/layer1-insumos';
import styles from './Layer1.module.css';

interface CategorySelectorProps {
  counts: Record<InsumoCategory, number>;
  active: InsumoCategory | 'all';
  onSelect: (category: InsumoCategory | 'all') => void;
}

const CATEGORIES: { key: InsumoCategory; icon: string; label: string }[] = [
  { key: 'ingrediente', icon: '🥕', label: 'Ingredientes' },
  { key: 'material', icon: '📦', label: 'Materiales' },
  { key: 'utensilio', icon: '🍳', label: 'Utensilios' },
  { key: 'maquina', icon: '⚙️', label: 'Máquinas' },
];

export default function CategorySelector({ counts, active, onSelect }: CategorySelectorProps) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className={styles.selectorWrapper}>
      <button
        className={`${styles.categoryCard} ${active === 'all' ? styles.active : ''}`}
        onClick={() => onSelect('all')}
        aria-pressed={active === 'all'}
      >
        📋 Todos
        <span className={styles.cardCount}>{total}</span>
      </button>

      {CATEGORIES.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`${styles.categoryCard} ${active === key ? styles.active : ''}`}
          onClick={() => onSelect(key)}
          aria-pressed={active === key}
        >
          {icon} {label}
          <span className={styles.cardCount}>{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}
