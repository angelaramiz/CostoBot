/**
 * ticket-types.ts — Definición de campos extraídos del ticket de compra
 * Basado en ticket educativo "La Parrilla del Norte" (Documento → Ticket de Compra)
 */

export interface TicketData {
  /** Folio del ticket, ej: TK-78012 */
  folio: string | null;
  /** Fecha del consumo, ej: 08-jul-2026 */
  fecha: string | null;
  /** Nombre del comercio, ej: La Parrilla del Norte */
  comercio: string | null;
  /** RFC del comercio, ej: LFN-880707-ABC */
  rfc: string | null;
  /** Subtotal de consumos (sin IVA ni propina) — campo Subtotal */
  subtotal: number | null; // centavos
  /** IVA del consumo (16%) — campo IVA del consumo */
  iva: number | null; // centavos
  /** Propina — campo Propina (no deducible) */
  propina: number | null; // centavos
  /** Total pagado — campo Total pagado */
  totalPagado: number | null; // centavos
  /** Porcentaje deducción restaurante (65% del subtotal) */
  deduccionPorcentaje: number;
  /** Texto legal informativo */
  notaLegal: string;
}

export const TICKET_EXTRACTION_GUIDE: {
  campo: keyof TicketData;
  etiqueta: string;
  origenTicket: string;
  ejemplo: string;
  nota?: string;
  deducible: boolean;
  generaIVA: boolean;
}[] = [
  { campo: 'folio', etiqueta: 'Folio', origenTicket: 'Folio: TK-78012', ejemplo: 'TK-78012', deducible: false, generaIVA: false },
  { campo: 'fecha', etiqueta: 'Fecha', origenTicket: 'Fecha: 08-jul-2026', ejemplo: '08-jul-2026', deducible: false, generaIVA: false },
  { campo: 'comercio', etiqueta: 'Comercio', origenTicket: 'La Parrilla del Norte', ejemplo: 'La Parrilla del Norte', deducible: false, generaIVA: false },
  { campo: 'rfc', etiqueta: 'RFC', origenTicket: 'RFC LFN-880707-ABC', ejemplo: 'LFN-880707-ABC', deducible: false, generaIVA: false },
  { campo: 'subtotal', etiqueta: 'Subtotal', origenTicket: 'Subtotal (consumos) $1,976.00', ejemplo: '$1,976.00', nota: 'Base para deducción 65%', deducible: true, generaIVA: false },
  { campo: 'iva', etiqueta: 'IVA del consumo', origenTicket: 'IVA (16%) $316.00', ejemplo: '$316.00', deducible: false, generaIVA: true },
  { campo: 'propina', etiqueta: 'Propina', origenTicket: 'Propina $198.00', ejemplo: '$198.00', nota: 'NO deducible, NO genera IVA', deducible: false, generaIVA: false },
  { campo: 'totalPagado', etiqueta: 'Total pagado', origenTicket: 'Total pagado $2,490.00', ejemplo: '$2,490.00', deducible: false, generaIVA: false },
];

export const TICKET_NOTA_LEGAL = 'Deducción restaurantes 65% del subtotal. La propina NO es deducible ni genera IVA.';

/** Calcula deducción restaurante: 65% del subtotal */
export function calcularDeduccionRestaurante(subtotalCentavos: number): number {
  return Math.round(subtotalCentavos * 0.65);
}
