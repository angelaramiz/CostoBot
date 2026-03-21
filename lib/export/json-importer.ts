/**
 * json-importer.ts
 * Parsea y valida un archivo JSON → BusinessProject tipado con Zod.
 */
import { z } from 'zod';
import { BusinessProjectSchema } from '@/validators/business-project.schema';
import type { BusinessProject } from '@/types/business-project';

/**
 * Schema de importación: igual que BusinessProjectSchema pero acepta
 * fechas como strings (formato ISO) ya que vienen de JSON.stringify().
 */
const ImportBusinessProjectSchema = BusinessProjectSchema.extend({
  createdAt: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date({ required_error: 'La fecha de creación es requerida' })
  ),
  updatedAt: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date({ required_error: 'La fecha de actualización es requerida' })
  ),
});

/**
 * Parsea y valida un valor desconocido como BusinessProject.
 * @throws Error con mensaje legible si la validación falla.
 */
export function importFromJSON(raw: unknown): BusinessProject {
  const result = ImportBusinessProjectSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `[${issue.path.join('.')}]` : '';
        return `${path} ${issue.message}`.trim();
      })
      .join('\n');
    throw new Error(`El archivo JSON no es válido:\n${issues}`);
  }

  return result.data as BusinessProject;
}

/**
 * Lee un File de tipo JSON y retorna el BusinessProject validado.
 * @throws Error si el archivo no es JSON válido o no pasa la validación.
 */
export async function importFromFile(file: File): Promise<BusinessProject> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo seleccionado no es un JSON válido.');
  }

  return importFromJSON(parsed);
}
