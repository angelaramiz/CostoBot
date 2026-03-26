/**
 * xlsx-exporter.ts
 * Exporta un BusinessProject a XLSX multi-sheet usando SheetJS CE.
 * Los valores monetarios están en centavos → se dividen entre 100 al exportar.
 */
import * as XLSX from '@e965/xlsx';
import type { BusinessProject } from '@/types/business-project';

// Centos → pesos
const toPesos = (centavos: number): number => centavos / 100;

/**
 * Aplica formato y ancho a las columnas de una worksheet.
 */
function setColWidths(ws: XLSX.WorkSheet, widths: number[]): void {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

/**
 * Aplica formato de número a un rango de celdas (fila inicial, col inicial → fila final, col final).
 */
function applyFormat(
  ws: XLSX.WorkSheet,
  range: XLSX.Range,
  colIndex: number,
  fmt: string
): void {
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: colIndex });
    if (ws[cellRef]) {
      ws[cellRef].z = fmt;
    }
  }
}

/** Genera la hoja de Insumos (Layer 1). */
function buildInsumoSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer1 } = project.layers;

  const headers = ['Nombre', 'Unidad', 'Cantidad', 'Costo/Unidad ($)', 'Subtotal ($)'];

  const rows = layer1.map((ins) => {
    // subtotal = suma de (costPerUnit * quantity) de todos los procesos que lo usan
    // En realidad el subtotal del insumo es costPerUnit * quantity (su aportación directa)
    const subtotal = ins.costPerUnit * ins.quantity;
    return [
      ins.name,
      ins.unit,
      ins.quantity,
      toPesos(ins.costPerUnit),
      toPesos(subtotal),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  // Formatos: Cantidad col 2, Costo col 3, Subtotal col 4
  applyFormat(ws, range, 2, '#,##0.00');
  applyFormat(ws, range, 3, '"$"#,##0.00');
  applyFormat(ws, range, 4, '"$"#,##0.00');

  setColWidths(ws, [30, 12, 12, 18, 18]);
  return ws;
}

/** Genera la hoja de Grafos de Producto (Layer 2). */
function buildProductGraphSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer2 } = project.layers;

  const headers = ['Producto', 'Nodos', 'Aristas', 'Costo laboral ($)', 'Costo total ($)'];

  const rows = layer2.map((graph) => [
    graph.productName,
    graph.nodes.length,
    graph.edges.length,
    toPesos(graph.laborCost),
    toPesos(graph.totalCost),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  applyFormat(ws, range, 3, '"$"#,##0.00');
  applyFormat(ws, range, 4, '"$"#,##0.00');

  setColWidths(ws, [30, 10, 10, 18, 18]);
  return ws;
}

/** Genera la hoja de Precios (Layer 3). */
function buildPrecioSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer3 } = project.layers;
  const products = layer3.products;

  const headers = ['Producto', 'Costo total ($)', 'Margen %', 'Precio de venta ($)', 'ROI %'];

  const rows = products.map((pricing) => [
    pricing.productName,
    toPesos(pricing.costBreakdown.totalCost),
    pricing.margenPorcentaje / 100,
    toPesos(pricing.precioVenta),
    pricing.roi / 100,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  applyFormat(ws, range, 1, '"$"#,##0.00');
  applyFormat(ws, range, 2, '0.00%');
  applyFormat(ws, range, 3, '"$"#,##0.00');
  applyFormat(ws, range, 4, '0.00%');

  setColWidths(ws, [30, 18, 12, 20, 12]);
  return ws;
}

/**
 * Exporta el proyecto como archivo XLSX multi-sheet.
 * Solo funciona en el navegador (usa `URL.createObjectURL`).
 */
export function exportToXLSX(project: BusinessProject): void {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildInsumoSheet(project), 'Insumos');
  XLSX.utils.book_append_sheet(wb, buildProductGraphSheet(project), 'Productos');
  XLSX.utils.book_append_sheet(wb, buildPrecioSheet(project), 'Precios');

  const safeName = project.name.replace(/[^a-zA-Z0-9-_\u00C0-\u024F]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `costobot-${safeName}-${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
