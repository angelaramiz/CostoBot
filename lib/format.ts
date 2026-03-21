/**
 * lib/format.ts — Utilidades de formateo para CostoBot.
 * Los valores monetarios se almacenan en centavos (enteros).
 */

/** Formatea centavos como moneda MXN: 1500 → "$15.00" */
export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

/** Convierte string de pesos a centavos enteros: "15.50" → 1550 */
export function parseCurrency(value: string): number {
  const pesos = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  return Math.round(pesos * 100);
}

/** Formatea porcentaje: 30 → "30.0%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Tiempo relativo desde una fecha: "hace 5s", "hace 2m" */
export function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return 'ahora mismo';
  if (diff < 60) return `hace ${diff}s`;
  return `hace ${Math.floor(diff / 60)}m`;
}
