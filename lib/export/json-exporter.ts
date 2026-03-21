/**
 * json-exporter.ts
 * Serializa un BusinessProject a JSON y descarga el archivo en el navegador.
 */
import type { BusinessProject } from '@/types/business-project';

/**
 * Exporta el proyecto como archivo `.json`.
 * Nombre: `costobot-{projectName}-{fecha}.json`
 * Solo funciona en el navegador.
 */
export function exportToJSON(project: BusinessProject): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = project.name.replace(/[^a-zA-Z0-9-_\u00C0-\u024F]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `costobot-${safeName}-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
