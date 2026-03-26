'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import ProjectTabs from '@/components/project/ProjectTabs';
import type { TabId } from '@/components/project/ProjectTabs';
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';
import ChatPanel from '@/components/ia/ChatPanel';
import ExportMenu from '@/components/export/ExportMenu';
import { SettingsIcon } from '@/components/ui/icons';
import styles from './ProjectPage.module.css';

export default function ProjectPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('layer1');

  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const syncError = useProjectStore((s) => s.syncError);
  const loadProject = useProjectStore((s) => s.loadProject);

  useEffect(() => {
    if (id && token) {
      loadProject(id, token);
    }
  }, [id, token, loadProject]);

  if (syncError && !project) {
    return (
      <div className={styles.errorState}>
        <p>⚠ No se pudo cargar el proyecto.</p>
        <small>{syncError}</small>
        <Link href="/dashboard">← Volver al dashboard</Link>
      </div>
    );
  }

  if (!project) {
    return <div className={styles.loadingState}>Cargando proyecto…</div>;
  }

  return (
    <main className={styles.projectWrapper}>
      <header className={styles.projectHeader}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <h1 className={styles.projectName}>{project.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <ExportMenu />
          <button
            onClick={() => setActiveTab('settings')}
            title="Ajustes del proyecto"
            aria-label="Abrir configuración"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: activeTab === 'settings' ? '#2563eb' : 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.82rem',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = activeTab === 'settings' ? '#2563eb' : 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <SettingsIcon size={14} />
            Ajustes
          </button>
          <AutoSaveIndicator />
        </div>
      </header>

      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ChatPanel projectId={id} />
    </main>
  );
}
