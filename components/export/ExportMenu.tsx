'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/project.store';
import { exportToXLSX } from '@/lib/export/xlsx-exporter';
import { exportToJSON } from '@/lib/export/json-exporter';
import ImportDialog from './ImportDialog';
import styles from './ExportMenu.module.css';

export default function ExportMenu() {
  const project = useProjectStore((s) => s.currentProject);
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleExportXLSX() {
    if (!project) return;
    exportToXLSX(project);
    setOpen(false);
  }

  function handleExportJSON() {
    if (!project) return;
    exportToJSON(project);
    setOpen(false);
  }

  function handleImportJSON() {
    setOpen(false);
    setShowImport(true);
  }

  return (
    <>
      <div className={styles.wrapper} ref={menuRef}>
        <button
          className={styles.trigger}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          title="Exportar / Importar"
        >
          ↓ Exportar
        </button>

        {open && (
          <div className={styles.dropdown} role="menu">
            <button
              className={styles.item}
              onClick={handleExportXLSX}
              disabled={!project}
              role="menuitem"
            >
              📊 Exportar XLSX
            </button>
            <button
              className={styles.item}
              onClick={handleExportJSON}
              disabled={!project}
              role="menuitem"
            >
              📄 Exportar JSON
            </button>
            <div className={styles.divider} />
            <button
              className={styles.item}
              onClick={handleImportJSON}
              role="menuitem"
            >
              📥 Importar JSON
            </button>
          </div>
        )}
      </div>

      {showImport && (
        <ImportDialog onClose={() => setShowImport(false)} />
      )}
    </>
  );
}
