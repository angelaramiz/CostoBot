'use client';

import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import VersionBadge from '@/components/ui/VersionBadge';

/**
 * AppLayout — layout para rutas protegidas.
 * Registra el listener de onAuthStateChanged aquí (una sola vez).
 * AuthGuard redirige a /login si no hay sesión.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  // useAuth registra onAuthStateChanged vía useEffect interno
  useAuth();

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
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '6px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <VersionBadge />
        </footer>
      </div>
    </AuthGuard>
  );
}
