'use client';

import { useRef, useState } from 'react';
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
  const layers = project.layers ?? { layer1: [], layer2: [], layer3: [], layer4: [] };
  const totalInsumos = layers.layer1.length;
  const totalProductos = layers.layer3.length;
  const totalPrecios = layers.layer4.length;
  const maxPrecioVenta = layers.layer4.reduce((max, p) => Math.max(max, p.precioVenta), 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (!confirm(`¿Eliminar "${project.name}"? Esta acción no se puede deshacer.`)) return;
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
