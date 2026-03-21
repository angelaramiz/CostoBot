'use client';

/**
 * Layout del proyecto — solo pasa el contenido.
 * La autenticación ya está garantizada por (app)/layout.tsx.
 */
export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
