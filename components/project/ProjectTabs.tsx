'use client';

import { useState } from 'react';
import Layer1InsumoSheet from '@/components/sheets/Layer1InsumoSheet';
import Layer2ProcesoSheet from '@/components/sheets/Layer2ProcesoSheet';
import Layer3ProductoSheet from '@/components/sheets/Layer3ProductoSheet';
import { InsumoIcon, GearIcon, MoneyIcon } from '@/components/ui/icons';
import type { ReactNode } from 'react';
import styles from './ProjectTabs.module.css';

const TABS: { id: 'layer1' | 'layer2' | 'layer3'; label: string; icon: ReactNode }[] = [
  { id: 'layer1', label: 'Capa 1 — Insumos', icon: <InsumoIcon size={16} /> },
  { id: 'layer2', label: 'Capa 2 — Productos', icon: <GearIcon size={16} /> },
  { id: 'layer3', label: 'Capa 3 — Precios', icon: <MoneyIcon size={16} /> },
];

type TabId = 'layer1' | 'layer2' | 'layer3';

export default function ProjectTabs() {
  const [active, setActive] = useState<TabId>('layer1');

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabList} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`${styles.tab} ${active === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActive(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div
        className={styles.tabPanel}
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {active === 'layer1' && <Layer1InsumoSheet />}
        {active === 'layer2' && <Layer2ProcesoSheet />}
        {active === 'layer3' && <Layer3ProductoSheet />}
      </div>
    </div>
  );
}
