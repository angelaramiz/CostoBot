'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/project.store';
import { formatRelativeTime } from '@/lib/format';
import styles from './AutoSaveIndicator.module.css';

export default function AutoSaveIndicator() {
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSyncedAt = useProjectStore((s) => s.lastSyncedAt);
  const syncError = useProjectStore((s) => s.syncError);
  const [tick, setTick] = useState(0);
  // Derive timeLabel from lastSyncedAt + tick (updated every 5s) — avoids
  // calling setState synchronously inside a useEffect body.
  const timeLabel = useMemo(
    () => (lastSyncedAt ? formatRelativeTime(lastSyncedAt) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSyncedAt, tick]
  );

  useEffect(() => {
    if (!lastSyncedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 5000);
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
