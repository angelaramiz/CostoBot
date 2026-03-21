'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './TagSelector.module.css';

interface Option {
  id: string;
  label: string;
}

interface TagSelectorProps {
  selected: string[];
  options: Option[];
  placeholder?: string;
  onChange: (selectedIds: string[]) => void;
}

export default function TagSelector({
  selected,
  options,
  placeholder = 'Seleccionar…',
  onChange,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const labels = selected
    .map((id) => options.find((o) => o.id === id)?.label ?? id)
    .join(', ');

  return (
    <div ref={ref} className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        title="Click para editar"
      >
        {labels || <span className={styles.placeholder}>{placeholder}</span>}
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          {options.length === 0 && (
            <p className={styles.noOptions}>Sin opciones disponibles</p>
          )}
          {options.map((opt) => (
            <label key={opt.id} className={styles.option}>
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggle(opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
