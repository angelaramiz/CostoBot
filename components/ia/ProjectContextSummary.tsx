'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/project.store';
import { formatCurrency } from '@/lib/format';
import styles from './ProjectContextSummary.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ProjectContextSummary() {
  const project = useProjectStore((s) => s.currentProject);
  const [provider, setProvider] = useState<string>('openrouter');
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/ia/status`)
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.provider ?? 'openrouter');
        setAvailable(d.available ?? false);
      })
      .catch(() => setAvailable(false));
  }, []);

  if (!project) return null;

  const l1 = project.layers.layer1.length;
  const l2 = project.layers.layer2.length;
  const l3 = project.layers.layer3.length;
  const l4 = project.layers.layer4.length;

  const avgCost =
    l3 > 0
      ? Math.round(project.layers.layer3.reduce((a, p) => a + p.costoUnitario, 0) / l3)
      : 0;
  const avgMargen =
    l4 > 0
      ? project.layers.layer4.reduce((a, p) => a + p.margenPorcentaje, 0) / l4
      : 0;

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Contexto enviado a la IA</p>
      <ul className={styles.list}>
        <li>📦 <strong>{l1}</strong> insumos, <strong>{l2}</strong> procesos</li>
        <li>🏷 <strong>{l3}</strong> productos — costo prom. <strong>{formatCurrency(avgCost)}</strong></li>
        <li>💰 <strong>{l4}</strong> precios — margen prom. <strong>{avgMargen.toFixed(1)}%</strong></li>
      </ul>
      <p className={styles.provider}>
        <span
          className={`${styles.dot} ${
            available === null ? styles.dotGray : available ? styles.dotGreen : styles.dotRed
          }`}
        />
        {available === null ? 'Verificando…' : available ? `${provider} activo` : `${provider} no disponible`}
      </p>
    </div>
  );
}
