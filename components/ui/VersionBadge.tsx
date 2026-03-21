const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'CostoBot';

export default function VersionBadge() {
  return (
    <span
      title={`${appName} v${version}`}
      style={{
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
        userSelect: 'none',
      }}
    >
      v{version}
    </span>
  );
}
