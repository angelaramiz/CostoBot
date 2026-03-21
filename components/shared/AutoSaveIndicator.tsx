'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/project.store';
import { formatRelativeTime } from '@/lib/format';
import styles from './AutoSaveIndicator.module.css';

export default function AutoSaveIndicator() {
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSyncedAt = useProjectStore((s) => s.lastSyncedAt);
  const syncError = useProjectStore((s) => s.syncError);
  const [timeLabel, setTimeLabel] = useState('');

  useEffect(() => {
    if (!lastSyncedAt) return;
    setTimeLabel(formatRelativeTime(lastSyncedAt));
    const id = setInterval(() => {
      setTimeLabel(formatRelativeTime(lastSyncedAt));
    }, 5000);
    return () => clearInterval(id);
  }, [lastSyncedAt]);

  if (syncError) {
    return <span className={styles.error}>⚠ Error al guardar</span>;
  }
  if (isDirty) {
    return <span className={styles.saving}>⟳ Guardando…</span>;
  }
  if (lastSyncedAt) {
    return <span className={styles.saved}>✓ Guardado {timeLabel}</span>;
  }
  return null;
}
