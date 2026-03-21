'use client';

import { useState, useRef } from 'react';
import { formatCurrency, parseCurrency, formatPercent } from '@/lib/format';
import styles from './EditableCell.module.css';

export type CellType = 'text' | 'number' | 'currency' | 'percent' | 'select';

interface EditableCellProps {
  value: string | number;
  type: CellType;
  readOnly?: boolean;
  onSave?: (newValue: string | number) => void;
  placeholder?: string;
  selectOptions?: string[];
  /** Resaltar brevemente (para indicar actualización en cascada) */
  highlight?: boolean;
}

export default function EditableCell({
  value,
  type,
  readOnly = false,
  onSave,
  placeholder,
  selectOptions,
  highlight = false,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function display(): string {
    if (type === 'currency') return formatCurrency(value as number);
    if (type === 'percent') return formatPercent(value as number);
    return String(value);
  }

  function startEdit() {
    if (readOnly || !onSave) return;
    if (type === 'currency') {
      setDraft(((value as number) / 100).toFixed(2));
    } else {
      setDraft(String(value));
    }
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    setEditing(false);
    if (!onSave) return;
    if (type === 'currency') {
      onSave(parseCurrency(draft));
    } else if (type === 'number' || type === 'percent') {
      onSave(parseFloat(draft) || 0);
    } else {
      onSave(draft.trim());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  // Select
  if (type === 'select' && editing && selectOptions) {
    return (
      <select
        className={styles.selectInput}
        value={String(value)}
        onChange={(e) => {
          setEditing(false);
          onSave?.(e.target.value);
        }}
        onBlur={() => setEditing(false)}
        autoFocus
      >
        {selectOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        type={type === 'text' ? 'text' : 'number'}
        step={type === 'currency' ? '0.01' : type === 'percent' ? '0.01' : '1'}
        min={type !== 'text' ? '0' : undefined}
        autoFocus
      />
    );
  }

  const cellClass = [
    styles.cell,
    readOnly ? styles.readOnly : styles.editable,
    highlight ? styles.highlight : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={cellClass}
      onClick={startEdit}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onKeyDown={(e) => { if (!readOnly && (e.key === 'Enter' || e.key === ' ')) startEdit(); }}
      aria-label={readOnly ? undefined : `Editar ${placeholder ?? 'valor'}`}
      title={readOnly ? undefined : 'Click para editar'}
    >
      {display() !== '' && display() !== '0' ? (
        display()
      ) : placeholder ? (
        <span className={styles.placeholder}>{placeholder}</span>
      ) : (
        display()
      )}
    </span>
  );
}
