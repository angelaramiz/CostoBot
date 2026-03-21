import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CostoBot',
  description: 'Calculadora de costos con IA conversacional',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

/** Viewport separado de metadata (requerido en Next.js 14+) */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
