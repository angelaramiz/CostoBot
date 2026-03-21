'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import ProjectCard from '@/components/dashboard/ProjectCard';
import NewProjectButton from '@/components/dashboard/NewProjectButton';
import styles from '@/components/dashboard/Dashboard.module.css';
import type { BusinessProject } from '@/types/business-project';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function DashboardPage() {
  const { displayName, email, signOut } = useAuth();
  const token = useAuthStore((s) => s.token) ?? '';
  const router = useRouter();
  const [projects, setProjects] = useState<BusinessProject[] | null>(null);
  const loading = projects === null && !!token;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((body) => {
        const list: BusinessProject[] = (body.data ?? []).map(
          (d: Record<string, unknown>) => ({
            ...(d as object),
            id: (d._id ?? d.id) as string,
            createdAt: new Date(d.createdAt as string),
            updatedAt: new Date(d.updatedAt as string),
          })
        );
        setProjects(list);
      })
      .catch(() => setProjects([]));
  }, [token]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <main className={styles.dashboardWrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis proyectos</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {displayName ?? email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '7px 14px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: '0.85rem',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className={styles.header} style={{ marginBottom: 16 }}>
        <NewProjectButton />
      </div>

      {loading ? (
        <div className={styles.loadingSpinner}>Cargando proyectos…</div>
      ) : (
        <div className={styles.grid}>
          {(projects ?? []).length === 0 ? (
            <div className={styles.emptyState}>
              <p>Aún no tienes proyectos.</p>
              <small>Crea uno con el botón de arriba.</small>
            </div>
          ) : (
            (projects ?? []).map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </div>
      )}
    </main>
  );
}
