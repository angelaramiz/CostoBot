'use client';

import { TICKET_EXTRACTION_GUIDE, TICKET_NOTA_LEGAL, calcularDeduccionRestaurante } from '@/lib/ticket/ticket-types';
import styles from './TicketExtractionGuide.module.css';

export default function TicketExtractionGuide() {
  const ejemploSubtotal = 197600; // $1,976.00 en centavos
  const deduccion = calcularDeduccionRestaurante(ejemploSubtotal);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Guía de extracción — Ticket de compra</h3>
        <p className={styles.subtitle}>Qué datos se extraen y a qué campo van. Documento educativo — Simulador Laboral.</p>
      </div>

      <div className={styles.layout}>
        {/* Ticket visual */}
        <div className={styles.ticketBox}>
          <div className={styles.ticket}>
            <div className={styles.ticketHead}>TICKET DE COMPRA</div>
            <div className={styles.ticketMeta}>
              <div>La Parrilla del Norte · RFC LFN-880707-ABC</div>
              <div><strong>Folio: TK-78012</strong></div>
              <div>Fecha: 08-jul-2026 · Restaurante La Parrilla del Norte</div>
            </div>

            <table className={styles.ticketTable}>
              <tbody>
                <tr>
                  <td>Subtotal<br/><span className={styles.small}>(consumos)</span></td>
                  <td className={styles.amount}>$1,976.00</td>
                  <td className={styles.arrow}>→ campo Subtotal</td>
                </tr>
                <tr>
                  <td>IVA (16%)</td>
                  <td className={styles.amount}>$316.00</td>
                  <td className={styles.arrow}>→ campo IVA del consumo</td>
                </tr>
                <tr>
                  <td>Propina</td>
                  <td className={styles.amount}>$198.00</td>
                  <td className={styles.arrow}>→ campo Propina <br/><span className={styles.small}>(no deducible)</span></td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>Total pagado</td>
                  <td className={styles.amount}>$2,490.00</td>
                  <td className={styles.arrow}>→ campo Total pagado</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.nota}>{TICKET_NOTA_LEGAL}</div>
            <div className={styles.gracias}>GRACIAS POR SU VISITA</div>
            <div className={styles.educativo}>Documento educativo · Simulador Laboral</div>
          </div>
        </div>

        {/* Tabla de mapeo */}
        <div className={styles.guideBox}>
          <h4 className={styles.guideTitle}>Campos extraídos</h4>
          <table className={styles.guideTable}>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Origen en ticket</th>
                <th>Ejemplo</th>
                <th>Regla</th>
              </tr>
            </thead>
            <tbody>
              {TICKET_EXTRACTION_GUIDE.map((r) => (
                <tr key={r.campo}>
                  <td><code>{r.etiqueta}</code></td>
                  <td>{r.origenTicket}</td>
                  <td>{r.ejemplo}</td>
                  <td>
                    {r.nota && <span className={styles.badgeNote}>{r.nota}</span>}
                    {!r.nota && r.deducible && <span className={styles.badgeOk}>Deducible 65%</span>}
                    {!r.nota && !r.deducible && r.campo !== 'propina' && <span className={styles.badgeMute}>Informativo</span>}
                    {r.campo === 'propina' && <span className={styles.badgeWarn}>No deducible / Sin IVA</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.calcBox}>
            <strong>Cálculo restaurante:</strong> Subtotal $1,976 × 65% = <strong>${(deduccion/100).toFixed(2)}</strong> deducible.
            <br/>IVA y propina no se deducen. La propina no genera IVA.
          </div>

          <div className={styles.hint}>
            Al importar el ticket (foto/PDF/JSON), estos 8 campos se autocompletan. Verifica folio, fecha y montos antes de guardar — el ticket es el comprobante fuente.
          </div>
        </div>
      </div>
    </div>
  );
}
