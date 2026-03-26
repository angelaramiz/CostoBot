'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import ProjectCard from '@/components/dashboard/ProjectCard';
import NewProjectButton from '@/components/dashboard/NewProjectButton';
import ChatPanel from '@/components/ia/ChatPanel';
import styles from '@/components/dashboard/Dashboard.module.css';
import type { BusinessProject } from '@/types/business-project';
import { API_URL } from '@/lib/config';

/** Clave en localStorage para rastrear si el usuario ya fue bienvenido */
function getWelcomedKey(uid: string) {
  return `costobot_welcomed_${uid}`;
}

export default function DashboardPage() {
  const { displayName, email, signOut } = useAuth();
  const { token, uid } = useAuthStore((s) => ({ token: s.token ?? '', uid: s.uid }));
  const router = useRouter();
  const [projects, setProjects] = useState<BusinessProject[] | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const loading = projects === null && !!token && !fetchError;

  // Detectar si es usuario nuevo: sin proyectos y nunca fue bienvenido
  const [isNewUser, setIsNewUser] = useState(false);

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

        // Si no tiene proyectos y no fue bienvenido antes → onboarding
        if (uid && list.length === 0 && !localStorage.getItem(getWelcomedKey(uid))) {
          setIsNewUser(true);
          localStorage.setItem(getWelcomedKey(uid), '1');
        }
      })
      .catch(() => {
        setProjects([]);
        setFetchError(true);
      });
  }, [token, uid]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  async function handleRename(id: string, newName: string) {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setProjects((prev) =>
        (prev ?? []).map((p) => (p.id === id ? { ...p, name: newName, updatedAt: new Date() } : p))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProjects((prev) => (prev ?? []).filter((p) => p.id !== id));
    }
  }

  const firstName = displayName?.split(' ')[0] ?? null;
  const onboardingWelcome = `¡Bienvenido${firstName ? ` ${firstName}` : ''} a CostoBot! 🎉

Soy tu asistente de costos. Estoy aquí para ayudarte a estructurar los costos de tu negocio de forma fácil y ordenada.

CostoBot organiza todo en 3 capas:
📦 **Capa 1 — Insumos**: materias primas, utensilios y maquinaria
🔗 **Capa 2 — Productos**: grafos visuales que conectan insumos para calcular costos
💰 **Capa 3 — Precios**: servicios, impuestos, márgenes y precio de venta

Para comenzar, cuéntame: ¿qué tipo de negocio tienes? ¿Fabricas algo, revendes productos o ofreces servicios?`;

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
        <div className={styles.loadingSpinner} role="status" aria-live="polite">
          Cargando proyectos…
        </div>
      ) : (
        <>
          {fetchError && (
            <div className={styles.errorBanner} role="alert">
              No se pudieron cargar los proyectos. Verifica tu conexión e intenta de nuevo.
            </div>
          )}
          <div className={styles.grid}>
            {(projects ?? []).length === 0 && !fetchError ? (
              <div className={styles.emptyState}>
                <p>Aún no tienes proyectos.</p>
                <small>Crea uno con el botón de arriba o pregúntale al asistente IA cómo empezar.</small>
              </div>
            ) : (
              (projects ?? []).map((p) => (
                <ProjectCard key={p.id} project={p} onRename={handleRename} onDelete={handleDelete} />
              ))
            )}
          </div>
        </>
      )}

      {/* ChatPanel en modo onboarding para usuarios nuevos, dashboard para el resto */}
      <ChatPanel
        mode={isNewUser ? 'onboarding' : 'dashboard'}
        autoOpen={isNewUser}
        welcomeMessage={isNewUser ? onboardingWelcome : undefined}
      />
    </main>
  );
}
