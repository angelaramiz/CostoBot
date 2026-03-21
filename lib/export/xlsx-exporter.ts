/**
 * xlsx-exporter.ts
 * Exporta un BusinessProject a XLSX multi-sheet usando SheetJS CE.
 * Los valores monetarios están en centavos → se dividen entre 100 al exportar.
 */
import * as XLSX from 'xlsx';
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

/** Genera la hoja de Procesos (Layer 2). */
function buildProcesoSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer1, layer2 } = project.layers;

  const insumoNames = new Map(layer1.map((i) => [i.id, i.name]));

  const headers = ['Nombre', 'Insumos incluidos', 'Costo laboral ($)', 'Costo total ($)'];

  const rows = layer2.map((proc) => {
    const insumos = proc.insumoIds
      .map((id) => insumoNames.get(id) ?? id)
      .join(', ');
    return [
      proc.name,
      insumos || '—',
      toPesos(proc.laborCost),
      toPesos(proc.totalCost),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  applyFormat(ws, range, 2, '"$"#,##0.00');
  applyFormat(ws, range, 3, '"$"#,##0.00');

  setColWidths(ws, [30, 40, 18, 18]);
  return ws;
}

/** Genera la hoja de Productos (Layer 3). */
function buildProductoSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer2, layer3 } = project.layers;

  const procesoNames = new Map(layer2.map((p) => [p.id, p.name]));

  const headers = ['Nombre', 'Procesos incluidos', 'Costo unitario ($)'];

  const rows = layer3.map((prod) => {
    const procesos = prod.procesoIds
      .map((id) => procesoNames.get(id) ?? id)
      .join(', ');
    return [
      prod.name,
      procesos || '—',
      toPesos(prod.costoUnitario),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  applyFormat(ws, range, 2, '"$"#,##0.00');

  setColWidths(ws, [30, 40, 20]);
  return ws;
}

/** Genera la hoja de Precios (Layer 4). */
function buildPrecioSheet(project: BusinessProject): XLSX.WorkSheet {
  const { layer3, layer4 } = project.layers;

  const productoNames = new Map(layer3.map((p) => [p.id, p.name]));

  const headers = ['Producto', 'Margen %', 'Precio de venta ($)', 'ROI %'];

  const rows = layer4.map((precio) => {
    return [
      productoNames.get(precio.productoId) ?? precio.productoId,
      precio.margenPorcentaje / 100,   // Excel percentage format
      toPesos(precio.precioVenta),
      precio.roi / 100,                 // Excel percentage format
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  applyFormat(ws, range, 1, '0.00%');
  applyFormat(ws, range, 2, '"$"#,##0.00');
  applyFormat(ws, range, 3, '0.00%');

  setColWidths(ws, [30, 12, 20, 12]);
  return ws;
}

/**
 * Exporta el proyecto como archivo XLSX multi-sheet.
 * Solo funciona en el navegador (usa `URL.createObjectURL`).
 */
export function exportToXLSX(project: BusinessProject): void {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildInsumoSheet(project), 'Insumos');
  XLSX.utils.book_append_sheet(wb, buildProcesoSheet(project), 'Procesos');
  XLSX.utils.book_append_sheet(wb, buildProductoSheet(project), 'Productos');
  XLSX.utils.book_append_sheet(wb, buildPrecioSheet(project), 'Precios');

  const safeName = project.name.replace(/[^a-zA-Z0-9-_\u00C0-\u024F]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `costobot-${safeName}-${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
