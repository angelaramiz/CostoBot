'use client';

import Link from 'next/link';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import styles from './Dashboard.module.css';
import type { BusinessProject } from '@/types/business-project';

interface ProjectCardProps {
  project: BusinessProject;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const totalInsumos = project.layers.layer1.length;
  const totalProductos = project.layers.layer3.length;
  const totalPrecios = project.layers.layer4.length;

  const maxPrecioVenta = project.layers.layer4.reduce(
    (max, p) => Math.max(max, p.precioVenta),
    0
  );

  return (
    <Link href={`/project/${project.id}`} className={styles.card}>
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
  );
}
