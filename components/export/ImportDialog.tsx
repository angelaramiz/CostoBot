'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import { importFromFile } from '@/lib/export/json-importer';
import type { BusinessProject } from '@/types/business-project';
import styles from './ImportDialog.module.css';

interface ImportDialogProps {
  onClose: () => void;
}

interface PreviewData {
  project: BusinessProject;
  insumos: number;
  procesos: number;
  productos: number;
  precios: number;
}

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const token = useAuthStore((s) => s.token) ?? '';
  const loadFromImport = useProjectStore((s) => s.loadFromImport);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap: mantiene el foco dentro del modal mientras está abierto
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Mover foco al diálogo al abrirse
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);

    try {
      const project = await importFromFile(file);
      setPreview({
        project,
        insumos: project.layers.layer1.length,
        procesos: project.layers.layer2.length,
        productos: project.layers.layer3.length,
        precios: project.layers.layer4.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer el archivo');
      // Limpiar input para permitir volver a seleccionar el mismo archivo
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setIsLoading(true);
    try {
      await loadFromImport(preview.project, token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar proyecto');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className={styles.header}>
          <h2 id="import-title" className={styles.title}>Importar proyecto JSON</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className={styles.body}>
          <label className={styles.fileLabel}>
            <span>Selecciona un archivo <code>.json</code> exportado por CostoBot:</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </label>

          {error && (
            <div className={styles.errorBox} role="alert">
              <strong>Error de validación:</strong>
              <pre className={styles.errorPre}>{error}</pre>
            </div>
          )}

          {preview && (
            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>Vista previa</h3>
              <p className={styles.projectName}>{preview.project.name}</p>
              <ul className={styles.statList}>
                <li><span className={styles.statLabel}>Insumos</span><span className={styles.statValue}>{preview.insumos}</span></li>
                <li><span className={styles.statLabel}>Procesos</span><span className={styles.statValue}>{preview.procesos}</span></li>
                <li><span className={styles.statLabel}>Productos</span><span className={styles.statValue}>{preview.productos}</span></li>
                <li><span className={styles.statLabel}>Precios</span><span className={styles.statValue}>{preview.precios}</span></li>
              </ul>
              <p className={styles.warning}>
                ⚠ Esto reemplazará los datos actuales del proyecto.
              </p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!preview || isLoading}
          >
            {isLoading ? 'Importando…' : 'Confirmar importación'}
          </button>
        </footer>
      </div>
    </div>
  );
}
