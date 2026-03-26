'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/project.store';
import { formatCurrency } from '@/lib/format';
import styles from './ProjectContextSummary.module.css';
import { API_URL } from '@/lib/config';

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

  const defaultLayer3 = { version: '1.0', updatedAt: '', services: {}, taxes: {}, products: [] as { costBreakdown: { totalCost: number }; margenPorcentaje: number }[] };
  const layers = project.layers ?? { layer1: [], layer2: [], layer3: defaultLayer3 };
  const l1 = layers.layer1.length;
  const l2 = layers.layer2.length;
  const l3Products = (layers.layer3 ?? defaultLayer3).products;
  const l3 = l3Products.length;

  const avgCost =
    l3 > 0
      ? Math.round(l3Products.reduce((a: number, p: { costBreakdown: { totalCost: number } }) => a + p.costBreakdown.totalCost, 0) / l3)
      : 0;
  const avgMargen =
    l3 > 0
      ? l3Products.reduce((a: number, p: { margenPorcentaje: number }) => a + p.margenPorcentaje, 0) / l3
      : 0;

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Contexto enviado a la IA</p>
      <ul className={styles.list}>
        <li>📦 <strong>{l1}</strong> insumos, <strong>{l2}</strong> grafos de producto</li>
        <li>💰 <strong>{l3}</strong> precios — costo prom. <strong>{formatCurrency(avgCost)}</strong></li>
        <li>📊 Margen prom. <strong>{avgMargen.toFixed(1)}%</strong></li>
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
