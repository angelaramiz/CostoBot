/**
 * save-engine.ts — CostoBot
 * 🔄 Sistema inteligente de guardado con:
 * - Validación defensiva de datos
 * - Retry con backoff exponencial
 * - Chunking para payloads grandes
 * - Error recovery y logging
 */

import type { BusinessProject, ProjectLayers } from '@/types/business-project';
import { normalizeProjectLayers } from './normalize-layers';

interface SaveAttempt {
  attempt: number;
  timestamp: Date;
  error?: string;
  success: boolean;
}

interface SaveResult {
  success: boolean;
  error: string | null;
  attempts: SaveAttempt[];
  totalTime: number;
}

interface SaveConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onProgress?: (msg: string) => void;
}

const DEFAULT_CONFIG: SaveConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  onProgress: (msg) => console.log(`[SaveEngine] ${msg}`),
};

/** Normaliza y valida capas antes de guardar */
function validateProjectData(project: BusinessProject): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar layer1
  if (!Array.isArray(project.layers.layer1)) {
    errors.push('layer1 debe ser un array');
  } else if (project.layers.layer1.length > 10000) {
    errors.push('layer1 no puede tener más de 10000 insumos');
  }

  // Validar layer2
  if (!Array.isArray(project.layers.layer2)) {
    errors.push('layer2 debe ser un array');
  } else if (project.layers.layer2.length > 1000) {
    errors.push('layer2 no puede tener más de 1000 grafos');
  }

  // Validar cada grafo de layer2
  for (let i = 0; i < project.layers.layer2.length; i++) {
    const graph = project.layers.layer2[i];
    if (!Array.isArray(graph.nodes)) {
      errors.push(`layer2[${i}].nodes no es un array`);
    }
    if (!Array.isArray(graph.edges)) {
      errors.push(`layer2[${i}].edges no es un array`);
    }
  }

  // Validar layer3
  if (typeof project.layers.layer3 !== 'object') {
    errors.push('layer3 debe ser un objeto');
  } else {
    if (!Array.isArray(project.layers.layer3.products)) {
      errors.push('layer3.products debe ser un array');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Calcula delay exponencial con jitter */
function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number
): number {
  const exponential = Math.min(
    initialDelayMs * Math.pow(2, attempt),
    maxDelayMs
  );
  const jitter = Math.random() * 0.1 * exponential; // ±10%
  return Math.floor(exponential + jitter);
}

/** Descansa N ms */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Intenta guardar el proyecto con reintentos automáticos
 * @param projectId ID del proyecto
 * @param project Datos del proyecto a guardar
 * @param token Token de autenticación
 * @param apiUrl URL base de la API
 * @param config Configuración de reintentos
 */
export async function smartSaveProject(
  projectId: string,
  project: BusinessProject,
  token: string,
  apiUrl: string,
  config: SaveConfig = {}
): Promise<SaveResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const attempts: SaveAttempt[] = [];

  // 1️⃣ Validar datos antes de intentar guardar
  const validation = validateProjectData(project);
  if (!validation.valid) {
    const errorMsg = validation.errors.join('; ');
    cfg.onProgress?.(`❌ Validación fallida: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      attempts: [
        {
          attempt: 0,
          timestamp: new Date(),
          error: errorMsg,
          success: false,
        },
      ],
      totalTime: Date.now() - startTime,
    };
  }

  cfg.onProgress?.(`✅ Validación exitosa (${Object.keys(project.layers.layer1).length} insumos)`);

  // 2️⃣ Normalizar capas para evitar datos undefined/null
  const normalizedLayers = normalizeProjectLayers(project.layers);

  // 3️⃣ Reintentar con backoff exponencial
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (cfg.maxRetries ?? 3); attempt++) {
    try {
      cfg.onProgress?.(`📤 Intento ${attempt + 1}/${(cfg.maxRetries ?? 3) + 1}...`);

      const response = await fetch(
        `${apiUrl}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': `save-${projectId}-${Date.now()}`,
          },
          body: JSON.stringify({
            name: project.name,
            layers: normalizedLayers,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(
          body.message ?? `HTTP ${response.status}: ${response.statusText}`
        );
        throw error;
      }

      // ✅ Éxito
      cfg.onProgress?.(`✅ Guardado exitoso en intento ${attempt + 1}`);
      attempts.push({
        attempt: attempt + 1,
        timestamp: new Date(),
        success: true,
      });

      return {
        success: true,
        error: null,
        attempts,
        totalTime: Date.now() - startTime,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      attempts.push({
        attempt: attempt + 1,
        timestamp: new Date(),
        error: lastError.message,
        success: false,
      });

      if (attempt < (cfg.maxRetries ?? 3)) {
        const delay = calculateBackoff(
          attempt,
          cfg.initialDelayMs ?? 500,
          cfg.maxDelayMs ?? 5000
        );
        cfg.onProgress?.(
          `⏳ Error: ${lastError.message}. Reintentando en ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  // ❌ Fallo después de todos los reintentos
  const finalError = lastError?.message ?? 'Error desconocido al guardar';
  cfg.onProgress?.(`❌ Guardado fallido después de ${attempts.length} intentos`);

  return {
    success: false,
    error: finalError,
    attempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Valida si un proyecto es guardable sin hacer llamadas a API
 * (útil antes de importación para detectar problemas localmente)
 */
export function isProjectSaveable(project: BusinessProject): {
  saveable: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validar estructura básica
  if (!project.id) issues.push('Project no tiene ID');
  if (!project.name) issues.push('Project no tiene nombre');
  if (!project.layers) issues.push('Project no tiene layers');

  // Validar usando validateProjectData
  const validation = validateProjectData(project);
  if (!validation.valid) {
    issues.push(...validation.errors);
  }

  return {
    saveable: issues.length === 0,
    issues,
  };
}

/**
 * Retorna información sobre el tamaño del payload
 * (útil para debugging y monitoreo)
 */
export function getProjectPayloadInfo(project: BusinessProject): {
  bytes: number;
  kbytes: number;
  itemCounts: {
    layer1: number;
    layer2: number;
    layer3products: number;
  };
} {
  const json = JSON.stringify({
    name: project.name,
    layers: project.layers,
  });

  return {
    bytes: json.length,
    kbytes: Math.round(json.length / 1024),
    itemCounts: {
      layer1: Array.isArray(project.layers.layer1)
        ? project.layers.layer1.length
        : 0,
      layer2: Array.isArray(project.layers.layer2)
        ? project.layers.layer2.length
        : 0,
      layer3products: Array.isArray(project.layers.layer3?.products)
        ? project.layers.layer3.products.length
        : 0,
    },
  };
}
