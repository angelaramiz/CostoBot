'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import { importFromFile } from '@/lib/export/json-importer';
import TicketExtractionGuide from '@/components/ticket/TicketExtractionGuide';
import type { BusinessProject } from '@/types/business-project';
import styles from './ImportDialog.module.css';

interface ImportDialogProps {
  onClose: () => void;
}

interface PreviewData {
  project: BusinessProject;
  insumos: number;
  grafos: number;
  precios: number;
}

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const token = useAuthStore((s) => s.token) ?? '';
  const currentProject = useProjectStore((s) => s.currentProject);
  const loadFromImport = useProjectStore((s) => s.loadFromImport);
  const syncProgress = useProjectStore((s) => s.syncProgress);
  const isSaving = useProjectStore((s) => s.isSaving);
  const syncError = useProjectStore((s) => s.syncError);

  const [activeTab, setActiveTab] = useState<'json' | 'ticket'>('json');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wasSavingRef, setWasSaving] = useState(false); // Trackear transición de guardado
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cerrar automáticamente SOLO después de guardar exitosamente
  useEffect(() => {
    // Si ESTABA guardando y ahora NO está guardando + no hay error = éxito
    if (wasSavingRef && !isSaving && !syncError) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Actualizar el ref con estado actual
    setWasSaving(isSaving);
  }, [isSaving, syncError, onClose]);

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

    setLocalError(null);
    setPreview(null);

    try {
      const project = await importFromFile(file);
      setPreview({
        project,
        insumos: project.layers.layer1.length,
        grafos: project.layers.layer2.length,
        precios: project.layers.layer3.products.length,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al leer el archivo');
      // Limpiar input para permitir volver a seleccionar el mismo archivo
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleConfirm() {
    if (!preview || !currentProject) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      // Pasar el ID del proyecto actual donde se está haciendo la importación
      await loadFromImport(preview.project, token, currentProject.id);
      // El diálogo se cerrará automáticamente cuando isSaving se ponga en false
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al importar proyecto');
      setIsLoading(false);
    }
  }

  const errorToShow = syncError || localError;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}>
      <div className={styles.dialog} ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="import-title" style={{ maxWidth: activeTab === 'ticket' ? 980 : undefined, width: activeTab === 'ticket' ? '96vw' : undefined }}>
        <header className={styles.header}>
          <h2 id="import-title" className={styles.title}>{activeTab === 'ticket' ? 'Importar ticket de compra' : 'Importar proyecto JSON'}</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isLoading || isSaving} aria-label="Cerrar">✕</button>
        </header>

        <div style={{ display: 'flex', gap: 8, padding: '0 16px', borderBottom: '1px solid #334155' }}>
          <button onClick={() => setActiveTab('json')} style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: activeTab === 'json' ? 700 : 400, color: activeTab === 'json' ? '#38bdf8' : '#94a3b8', background: 'transparent', border: 'none', borderBottom: activeTab === 'json' ? '2px solid #38bdf8' : '2px solid transparent', cursor: 'pointer' }}>Proyecto JSON</button>
          <button onClick={() => setActiveTab('ticket')} style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: activeTab === 'ticket' ? 700 : 400, color: activeTab === 'ticket' ? '#38bdf8' : '#94a3b8', background: 'transparent', border: 'none', borderBottom: activeTab === 'ticket' ? '2px solid #38bdf8' : '2px solid transparent', cursor: 'pointer' }}>Ticket de compra</button>
        </div>

        <div className={styles.body}>
          {isSaving ? (
            // 📊 Estado de guardado en progreso
            <div className={styles.progressBox} role="status" aria-live="polite">
              <div className={styles.spinner} />
              <p className={styles.progressText}>
                {syncProgress || 'Importando...'}
              </p>
            </div>
          ) : activeTab === 'ticket' ? (
            <div>
              <TicketExtractionGuide />
              <div style={{ marginTop: 12, padding: 12, border: '1px dashed #334155', borderRadius: 8, background: '#020617' }}>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0 0 8px' }}>Sube foto/PDF del ticket — se extraerán folio, fecha, comercio, RFC, subtotal, IVA, propina y total. Validación OCR pendiente.</p>
                <input type="file" accept="image/*,application/pdf" disabled style={{ fontSize: '0.8rem', color: '#64748b' }} />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 8 }}>Próximamente: OCR automático</span>
              </div>
            </div>
          ) : (
            <>
              <label className={styles.fileLabel}>
                <span>Selecciona un archivo <code>.json</code> exportado por CostoBot:</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  disabled={isLoading}
                />
              </label>

              {errorToShow && (
                <div className={styles.errorBox} role="alert">
                  <strong>❌ Error:</strong>
                  <pre className={styles.errorPre}>{errorToShow}</pre>
                </div>
              )}

              {preview && (
                <div className={styles.preview}>
                  <h3 className={styles.previewTitle}>Vista previa</h3>
                  <p className={styles.projectName}>{preview.project.name}</p>
                  <ul className={styles.statList}>
                    <li><span className={styles.statLabel}>Insumos</span><span className={styles.statValue}>{preview.insumos}</span></li>
                    <li><span className={styles.statLabel}>Grafos de producto</span><span className={styles.statValue}>{preview.grafos}</span></li>
                    <li><span className={styles.statLabel}>Precios</span><span className={styles.statValue}>{preview.precios}</span></li>
                  </ul>
                  <p className={styles.warning}>
                    ⚠ Esto reemplazará los datos actuales del proyecto.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading || isSaving}>
            Cancelar
          </button>
          {activeTab === 'json' ? (
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={!preview || isLoading || isSaving}
            >
              {isLoading || isSaving ? 'Importando…' : 'Confirmar importación'}
            </button>
          ) : (
            <button className={styles.confirmBtn} disabled style={{ opacity: 0.5 }}>
              OCR próximamente
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
