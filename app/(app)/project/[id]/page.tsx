'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';
import ProjectTabs from '@/components/project/ProjectTabs';
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';
import ChatPanel from '@/components/ia/ChatPanel';
import ExportMenu from '@/components/export/ExportMenu';
import styles from './ProjectPage.module.css';

export default function ProjectPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

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
          <AutoSaveIndicator />
        </div>
      </header>

      <ProjectTabs />
      <ChatPanel projectId={id} />
    </main>
  );
}
