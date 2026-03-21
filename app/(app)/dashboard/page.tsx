'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { displayName, email, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          CostoBot — Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {displayName ?? email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
        }}
      >
        <p style={{ fontSize: '1.125rem', margin: 0 }}>
          Tus proyectos aparecerán aquí.
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          (MVP-04 — en construcción)
        </p>
      </div>
    </main>
  );
}
