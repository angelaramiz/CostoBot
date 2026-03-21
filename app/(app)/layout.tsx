'use client';

import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';

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
        }}
      >
        {children}
      </div>
    </AuthGuard>
  );
}
