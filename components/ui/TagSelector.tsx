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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Calcular posición del dropdown — en tablas con overflow-x, position:absolute
  // queda clippeado. Usamos position:fixed con coordenadas del trigger.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(220, options.length * 38 + 16);

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      // Abre hacia arriba si no hay espacio abajo
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 180),
        zIndex: 9999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 180),
        zIndex: 9999,
      });
    }
  }, [open, options.length]);

  useEffect(() => {
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // Escuchar tanto mousedown (desktop) como touchstart (móvil)
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
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
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Click para editar"
      >
        {labels || <span className={styles.placeholder}>{placeholder}</span>}
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-multiselectable="true"
          style={dropdownStyle}
        >
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
