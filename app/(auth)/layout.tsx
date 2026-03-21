import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CostoBot — Acceder',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        padding: '1rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        gap: '24px',
      }}
    >
      <img src="/logo.svg" alt="CostoBot" height={36} style={{ display: 'block' }} />
      {children}
    </div>
  );
}
