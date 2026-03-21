'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import VersionBadge from '@/components/ui/VersionBadge';

// Pinga el backend al cargar; devuelve true cuando responde.
function useBackendWakeup() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setReady(true); return; }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    fetch(`${url}/health`, { method: 'GET', signal: controller.signal })
      .then(() => setReady(true))
      .catch(() => setReady(true)); // si falla igual muestra la app

    return () => clearTimeout(timeout);
  }, []);

  return ready;
}

function BackendWakingBanner() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30,30,40,0.92)',
        color: '#e2e8f0',
        borderRadius: 12,
        padding: '10px 20px',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 16 }}>⚡</span>
      <span>Iniciando servidor{dots}</span>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#f59e0b',
          display: 'inline-block',
          animation: 'pulse 1s infinite',
        }}
      />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/**
 * AppLayout — layout para rutas protegidas.
 * Registra el listener de onAuthStateChanged aquí (una sola vez).
 * AuthGuard redirige a /login si no hay sesión.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  useAuth();
  const backendReady = useBackendWakeup();

  return (
    <AuthGuard>
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          minHeight: '100vh',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <img src="/logo.svg" alt="CostoBot" height={24} style={{ display: 'block' }} />
          <VersionBadge />
        </footer>
      </div>
      {!backendReady && <BackendWakingBanner />}
    </AuthGuard>
  );
}
