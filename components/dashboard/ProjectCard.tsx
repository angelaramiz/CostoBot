'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import styles from './Dashboard.module.css';
import type { BusinessProject } from '@/types/business-project';

interface ProjectCardProps {
  project: BusinessProject;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const defaultLayer3 = { version: '1.0', updatedAt: '', services: {}, taxes: {}, products: [] };
  const layers = project.layers ?? { layer1: [], layer2: [], layer3: defaultLayer3 };
  const totalInsumos = layers.layer1.length;
  const totalProductos = layers.layer2.length;
  const l3 = layers.layer3 ?? defaultLayer3;
  const totalPrecios = l3.products.length;
  const maxPrecioVenta = l3.products.reduce(
    (max: number, p: { precioVenta: number }) => Math.max(max, p.precioVenta),
    0
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  function toggleMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  function startRename(e: React.MouseEvent) {
    e.preventDefault();
    setMenuOpen(false);
    setRenameValue(project.name);
    setRenaming(true);
  }

  async function confirmRename(e: React.FormEvent) {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name || name === project.name) { setRenaming(false); return; }
    setBusy(true);
    await onRename?.(project.id, name);
    setBusy(false);
    setRenaming(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    setMenuOpen(false);
    setPendingDelete(true);
  }

  async function confirmDelete() {
    setPendingDelete(false);
    setBusy(true);
    await onDelete?.(project.id);
    setBusy(false);
  }

  return (
    <div className={`${styles.card} ${busy ? styles.cardBusy : ''}`} style={{ position: 'relative' }}>
      {/* Menú de opciones */}
      <div className={styles.cardMenu} ref={menuRef}>
        <button
          className={styles.cardMenuBtn}
          onClick={toggleMenu}
          title="Opciones"
          aria-label="Opciones del proyecto"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className={styles.cardMenuDropdown}>
            <button className={styles.cardMenuItem} onClick={startRename}>✏️ Renombrar</button>
            <button className={`${styles.cardMenuItem} ${styles.cardMenuItemDanger}`} onClick={handleDelete}>🗑️ Eliminar</button>
          </div>
        )}
      </div>

      {/* Confirmación de eliminación — reemplaza confirm() nativo */}
      {pendingDelete && (
        <div className={styles.deleteConfirm} role="alertdialog" aria-label={`Confirmar eliminación de ${project.name}`}>
          <p className={styles.deleteConfirmText}>¿Eliminar &ldquo;{project.name}&rdquo;? Esta acción no se puede deshacer.</p>
          <div className={styles.deleteConfirmActions}>
            <button
              className={`${styles.cardMenuItem} ${styles.cardMenuItemDanger}`}
              onClick={confirmDelete}
              disabled={busy}
            >
              🗑️ Eliminar
            </button>
            <button className={styles.cardMenuItem} onClick={() => setPendingDelete(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Rename inline */}
      {renaming ? (
        <form onSubmit={confirmRename} className={styles.renameForm}>
          <input
            autoFocus
            className={styles.renameInput}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={80}
          />
          <button type="submit" className={styles.renameConfirm} disabled={busy}>✓</button>
          <button type="button" className={styles.renameCancel} onClick={() => setRenaming(false)}>✕</button>
        </form>
      ) : (
        <Link href={`/project/${project.id}`} className={styles.cardLink}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{project.name}</h3>
            <span className={styles.cardDate}>
              {formatRelativeTime(new Date(project.updatedAt))}
            </span>
          </div>
          <div className={styles.cardStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Insumos</span>
              <span className={styles.statValue}>{totalInsumos}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Productos</span>
              <span className={styles.statValue}>{totalProductos}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Precios</span>
              <span className={styles.statValue}>{totalPrecios}</span>
            </div>
            {maxPrecioVenta > 0 && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Precio máx.</span>
                <span className={`${styles.statValue} ${styles.priceValue}`}>
                  {formatCurrency(maxPrecioVenta)}
                </span>
              </div>
            )}
          </div>
        </Link>
      )}
    </div>
  );
}
