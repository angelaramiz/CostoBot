import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CostoBot',
  description: 'Calculadora de costos con IA conversacional',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
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
